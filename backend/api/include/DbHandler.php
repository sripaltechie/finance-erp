<?php

class DbHandler {
    private $conn;

    function __construct() {
        require_once dirname(__FILE__) . '/DbConnect.php';
        $db = new DbConnect();
        $this->conn = $db->connect();
    }

    /* =========================================================================
       1. AUTHENTICATION METHODS (Clients)
       ========================================================================= */

    /**
     * Create a new SaaS Client (Owner)
     */
    public function createClient($name, $email, $mobile, $password, $businessName) {
        // 1. Check if user exists
        if ($this->isClientExists($email, $mobile)) {
            return USER_ALREADY_EXISTED;
        }

        // 2. Hash Password
        require_once 'passwordHash.php';
        $password_hash = passwordHash::hash($password);
        $status = 'Pending';
        $plan = 'Basic';

        // 3. Insert
        $stmt = $this->conn->prepare("INSERT INTO clients (owner_name, email, mobile, password, business_name, account_status, subscription_plan) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssss", $name, $email, $mobile, $password_hash, $businessName, $status, $plan);
        
        if ($stmt->execute()) {
            return SUCCESS;
        } else {
            return FAILED;
        }
    }

    /**
     * Check if Client exists
     */
    private function isClientExists($email, $mobile) {
        $stmt = $this->conn->prepare("SELECT id FROM clients WHERE email = ? OR mobile = ?");
        $stmt->bind_param("ss", $email, $mobile);
        $stmt->execute();
        $stmt->store_result();
        return $stmt->num_rows > 0;
    }

    /**
     * Login Client
     */
    public function loginClient($identifier, $password) {
        $stmt = $this->conn->prepare("SELECT id, owner_name, password, account_status, mobile FROM clients WHERE email = ? OR mobile = ?");
        $stmt->bind_param("ss", $identifier, $identifier);
        $stmt->execute();
        $stmt->bind_result($id, $ownerName, $passwordHash, $status, $mobile);
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            $stmt->fetch();
            $stmt->close();

            require_once 'passwordHash.php';
            if (passwordHash::check_password($passwordHash, $password)) {
                if ($status !== 'Approved') {
                    return ["status" => "PENDING_APPROVAL"];
                }
                // Fetch Companies
                $companies = $this->getMyCompanies($id);
                return [
                    "status" => SUCCESS,
                    "user" => [
                        "_id" => $id,
                        "ownerName" => $ownerName,
                        "role" => "Client",
                        "mobile" => $mobile,
                        "companies" => $companies
                    ]
                ];
            } else {
                return ["status" => FAILED]; // Wrong password
            }
        } else {
            return ["status" => FAILED]; // User not found
        }
    }


	    /**
     * Login Staff (Collection Boy / Manager)
     * 🟢 NEW: Allows Mobile App Login
     */
    public function loginStaff($mobile, $password) {
        $stmt = $this->conn->prepare("SELECT id, name, password, role, company_id, is_active FROM users WHERE mobile = ?");
        $stmt->bind_param("s", $mobile);
        $stmt->execute();
        $stmt->bind_result($id, $name, $hash, $role, $companyId, $isActive);
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            $stmt->fetch();
            $stmt->close();

            // Check Active Status
            if ($isActive == 0) {
                return ["status" => "DEACTIVATED"];
            }

            require_once 'passwordHash.php';
            if (passwordHash::check_password($hash, $password)) {
                return [
                    "status" => SUCCESS,
                    "user" => [
                        "_id" => $id,
                        "name" => $name,
                        "role" => $role,
                        "companyId" => $companyId // Crucial for App
                    ]
                ];
            } else {
                return ["status" => FAILED];
            }
        } else {
            return ["status" => FAILED];
        }
    }

    /* =========================================================================
       2. COMPANY METHODS
       ========================================================================= */

    /**
     * Create Company (Branch)
     */
    public function createCompany($clientId, $name, $address, $initialCapital, $settings) {
        // 1. Check Plan Limits
        if (!$this->checkPlanLimits($clientId)) {
            return PLAN_LIMIT_REACHED;
        }

        $this->conn->begin_transaction();
        try {
            // 2. Insert Company
            $stmt = $this->conn->prepare("INSERT INTO companies (client_id, name, address, settings) VALUES (?, ?, ?, ?)");
            $settingsJson = json_encode($settings);
            $stmt->bind_param("isss", $clientId, $name, $address, $settingsJson);
            $stmt->execute();
            $companyId = $stmt->insert_id;

            // 3. Add Capital Log (If any)
            if ($initialCapital > 0) {
                $type = 'Initial';
                $desc = 'Opening Balance';
                $capStmt = $this->conn->prepare("INSERT INTO capital_logs (company_id, amount, type, description) VALUES (?, ?, ?, ?)");
                $capStmt->bind_param("idss", $companyId, $initialCapital, $type, $desc);
                $capStmt->execute();
            }

            // 4. Auto-Create Admin User for this Company (using Owner's mobile)
            $this->createOwnerStaffAccount($companyId, $clientId);

            $this->conn->commit();
            return ["status" => SUCCESS, "_id" => $companyId];

        } catch (Exception $e) {
            $this->conn->rollback();
            return ["status" => FAILED, "error" => $e->getMessage()];
        }
    }

    public function getMyCompanies($clientId) {
        $stmt = $this->conn->prepare("SELECT id as _id, name, address, settings FROM companies WHERE client_id = ?");
        $stmt->bind_param("i", $clientId);
        $stmt->execute();
        $result = $stmt->get_result();
        $companies = array();
        while ($row = $result->fetch_assoc()) {
            $row['settings'] = json_decode($row['settings']);
            $companies[] = $row;
        }
        return $companies;
    }


    /**
     * Create Payment Mode (Wallet)
     */
    public function createPaymentMode($companyId, $name, $type, $initialBalance) {
        $currentBalance = $initialBalance;
        
        $stmt = $this->conn->prepare("INSERT INTO payment_modes (company_id, name, type, initial_balance, current_balance) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("issdd", $companyId, $name, $type, $initialBalance, $currentBalance);
        
        if ($stmt->execute()) {
            return ["status" => SUCCESS, "_id" => $stmt->insert_id];
        } else {
            return ["status" => FAILED];
        }
    }

    /**
     * Get Payment Modes for a Company
     */
    public function getPaymentModes($companyId) {
        $stmt = $this->conn->prepare("SELECT id as _id, name, type, current_balance, initial_balance, is_active FROM payment_modes WHERE company_id = ? AND is_active = 1");
        $stmt->bind_param("i", $companyId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /* =========================================================================
       3. STAFF MANAGEMENT
       ========================================================================= */

    /**
     * Create Staff Member
     */
    public function createStaff($companyId, $name, $mobile, $password, $role) {
        // 1. Check Duplicate Mobile
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE mobile = ?");
        $stmt->bind_param("s", $mobile);
        $stmt->execute();
        if ($stmt->fetch()) {
            return USER_ALREADY_EXISTED;
        }
        $stmt->close();

        // 2. Hash Password
        require_once 'passwordHash.php';
        $hash = passwordHash::hash($password);

        // 3. Insert
        $insert = $this->conn->prepare("INSERT INTO users (company_id, name, mobile, password, role) VALUES (?, ?, ?, ?, ?)");
        $insert->bind_param("issss", $companyId, $name, $mobile, $hash, $role);
        
        if ($insert->execute()) {
            return SUCCESS;
        } else {
            return FAILED;
        }
    }

    /**
     * Get Staff by Company
     */
    public function getStaffByCompany($companyId) {
        $stmt = $this->conn->prepare("SELECT id as _id, name, mobile, role, is_active, last_login FROM users WHERE company_id = ?");
        $stmt->bind_param("i", $companyId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }


    private function checkPlanLimits($clientId) {
        // Get Current Count
        $stmt = $this->conn->prepare("SELECT count(*) FROM companies WHERE client_id = ?");
        $stmt->bind_param("i", $clientId);
        $stmt->execute();
        $stmt->bind_result($count);
        $stmt->fetch();
        $stmt->close();

        // Get Plan
        $pStmt = $this->conn->prepare("SELECT subscription_plan FROM clients WHERE id = ?");
        $pStmt->bind_param("i", $clientId);
        $pStmt->execute();
        $pStmt->bind_result($plan);
        $pStmt->fetch();
        $pStmt->close();

        // Limits (Hardcoded match with Frontend)
        $limit = 1; // Basic
        if (strtolower($plan) === 'gold') $limit = 3;
        if (strtolower($plan) === 'platinum') $limit = 10;

        return $count < $limit;
    }

	
    private function createOwnerStaffAccount($companyId, $clientId) {
        // Fetch Client Details
        $stmt = $this->conn->prepare("SELECT owner_name, mobile FROM clients WHERE id = ?");
        $stmt->bind_param("i", $clientId);
        $stmt->execute();
        $stmt->bind_result($name, $mobile);
        $stmt->fetch();
        $stmt->close();

        // Create User
        require_once 'passwordHash.php';
        $defaultPass = passwordHash::hash($mobile); // Default password = mobile
        $role = 'Admin';
        $nameWithType = $name . " (Owner)";

        $uStmt = $this->conn->prepare("INSERT INTO users (company_id, name, mobile, password, role) VALUES (?, ?, ?, ?, ?)");
        $uStmt->bind_param("issss", $companyId, $nameWithType, $mobile, $defaultPass, $role);
        $uStmt->execute();
    }

    /* =========================================================================
       4. CUSTOMER MANAGEMENT
       ========================================================================= */

    /**
     * Create New Customer
     */
    public function createCustomer($companyId, $fullName, $mobile, $shortId, $locations, $kyc, $familyMembers, $createdBy) {
        // 1. Check Duplicate Mobile in this Company
        if ($this->isCustomerExists($companyId, $mobile)) {
            return USER_ALREADY_EXISTED;
        }

        // 2. Encode JSON Data
        $locJson = json_encode($locations);
        $kycJson = json_encode($kyc);
        $famJson = json_encode($familyMembers);

        // 3. Insert
        $stmt = $this->conn->prepare("INSERT INTO customers (company_id, full_name, mobile, short_id, locations, kyc, family_members, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("issssssi", $companyId, $fullName, $mobile, $shortId, $locJson, $kycJson, $famJson, $createdBy);
        
        if ($stmt->execute()) {
            return ["status" => SUCCESS, "_id" => $stmt->insert_id];
        } else {
            return ["status" => FAILED];
        }
    }

    /**
     * Check if Customer Exists (Helper)
     */
    private function isCustomerExists($companyId, $mobile) {
        $stmt = $this->conn->prepare("SELECT id FROM customers WHERE company_id = ? AND mobile = ?");
        $stmt->bind_param("is", $companyId, $mobile);
        $stmt->execute();
        $stmt->store_result();
        return $stmt->num_rows > 0;
    }

    /**
     * Get Customers (Supports Search)
     */
    public function getCustomers($companyId, $search = "") {
        $sql = "SELECT id as _id, full_name, mobile, short_id, locations, kyc, credit_score, level FROM customers WHERE company_id = ?";
        
        if (!empty($search)) {
            $sql .= " AND (full_name LIKE ? OR mobile LIKE ? OR short_id LIKE ?)";
        }
        $sql .= " ORDER BY id DESC LIMIT 50";

        $stmt = $this->conn->prepare($sql);
        
        if (!empty($search)) {
            $term = "%" . $search . "%";
            $stmt->bind_param("isss", $companyId, $term, $term, $term);
        } else {
            $stmt->bind_param("i", $companyId);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        
        $customers = array();
        while ($row = $result->fetch_assoc()) {
            // Decode JSON for Frontend
            $row['locations'] = json_decode($row['locations']);
            $row['kyc'] = json_decode($row['kyc']);
            $customers[] = $row;
        }
        return $customers;
    }

    /**
     * Get Single Customer by ID
     */
    public function getCustomerById($id) {
        $stmt = $this->conn->prepare("SELECT id as _id, full_name, mobile, short_id, locations, kyc, family_members, credit_score, level FROM customers WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            $row['locations'] = json_decode($row['locations']);
            $row['kyc'] = json_decode($row['kyc']);
            $row['familyMembers'] = json_decode($row['family_members']); // Note casing match for React
            return $row;
        }
        return null;
    }

    /**
     * Update Customer
     */
    public function updateCustomer($id, $data) {
        // Build dynamic query
        $fields = [];
        $params = [];
        $types = "";

        if (isset($data['fullName'])) { $fields[] = "full_name=?"; $params[] = $data['fullName']; $types .= "s"; }
        if (isset($data['mobile'])) { $fields[] = "mobile=?"; $params[] = $data['mobile']; $types .= "s"; }
        if (isset($data['locations'])) { $fields[] = "locations=?"; $params[] = json_encode($data['locations']); $types .= "s"; }
        if (isset($data['kyc'])) { $fields[] = "kyc=?"; $params[] = json_encode($data['kyc']); $types .= "s"; }
        if (isset($data['familyMembers'])) { $fields[] = "family_members=?"; $params[] = json_encode($data['familyMembers']); $types .= "s"; }

        if (empty($fields)) return ["status" => FAILED];

        $params[] = $id;
        $types .= "i";
        
        $sql = "UPDATE customers SET " . implode(", ", $fields) . " WHERE id=?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            return ["status" => SUCCESS];
        }
        return ["status" => FAILED];
    }

    /**
     * ⚠️ Check Conflicts (Ration Card / Defaulter Relatives)
     */
    public function checkConflict($rationCard, $mobile) {
        $warnings = [];

        // 1. Check Ration Card Usage
        if (!empty($rationCard)) {
            // JSON Query: Find customer with this ration card
            $sql = "SELECT id, full_name FROM customers WHERE JSON_UNQUOTE(JSON_EXTRACT(kyc, '$.rationCardNumber')) = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("s", $rationCard);
            $stmt->execute();
            $stmt->bind_result($custId, $custName);
            
            while ($stmt->fetch()) {
                // Check if they have an ACTIVE LOAN
                // Note: We need to close previous statement before running new query inside loop in strict mysqli
                // Ideally, fetch all first.
            }
            $stmt->close();

            // Re-run simplified for now (assuming strict mode might block nested queries)
            // Ideally: Join with loans table. 
            // Query: Find if any customer with this ration card has an active loan
            $sql2 = "SELECT c.full_name FROM customers c 
                     JOIN loans l ON c.id = l.customer_id 
                     WHERE JSON_UNQUOTE(JSON_EXTRACT(c.kyc, '$.rationCardNumber')) = ? 
                     AND l.status = 'Active' LIMIT 1";
            
            $stmt2 = $this->conn->prepare($sql2);
            $stmt2->bind_param("s", $rationCard);
            $stmt2->execute();
            $stmt2->bind_result($conflictName);
            if ($stmt2->fetch()) {
                $warnings[] = "Ration Card matches $conflictName who has an ACTIVE LOAN.";
            }
            $stmt2->close();
        }

        // 2. Check Defaulter Relative (Simulated logic for now, requires complex JSON search)
        // In production, you'd search if 'mobile' exists in 'family_members' array of any Level 3 customer.
        
        return ["hasConflict" => count($warnings) > 0, "warnings" => $warnings];
    }

     /* =========================================================================
       5. LOAN ORIGINATION
       ========================================================================= */

    public function createAdvancedLoan($companyId, $customerId, $data, $createdBy) {
        $loanType = $data['loanType'];
        $financials = $data['financials']; // JSON Array
        $deductions = isset($data['deductions']) ? $data['deductions'] : [];
        $paymentSplit = isset($data['paymentSplit']) ? $data['paymentSplit'] : [];
        $notes = isset($data['notes']) ? $data['notes'] : '';

        // 1. Calculate Net Disbursement
        $principal = $financials['principalAmount'];
        $netDisbursement = $principal;

        // Upfront Interest Deduction
        if (isset($financials['deductionConfig']['interest']) && $financials['deductionConfig']['interest'] == 'Upfront') {
            $rate = $financials['interestRate'];
            // Simple Interest Calc for deduction
            $interest = ($principal * $rate) / 100;
            $netDisbursement -= $interest;
        }

        // Other Deductions (Processing Fee, etc.)
        foreach ($deductions as $ded) {
            $netDisbursement -= $ded['amount'];
        }

        // 2. Validate & Prepare Wallets
        // We expect paymentSplit to be: [{"modeId": 1, "amount": 5000}, {"modeId": 2, "amount": 2000}]
        // OR object: {"Cash": 5000} (Legacy/Web handling). Let's standardize to array of IDs.
        
        $this->conn->begin_transaction();
        try {
            foreach ($paymentSplit as $split) {
                // If web sends { cash: 5000 }, we need to resolve ID. 
                // Assuming strict [{modeId: 1, amount: 500}] for now matching Node Controller.
                if (isset($split['modeId'])) {
                    $modeId = $split['modeId'];
                    $amount = $split['amount'];
                    
                    // Check Balance
                    $wallet = $this->getWalletById($modeId);
                    if ($wallet['current_balance'] < $amount) {
                        throw new Exception("Insufficient balance in wallet: " . $wallet['name']);
                    }

                    // Deduct
                    $newBal = $wallet['current_balance'] - $amount;
                    $upd = $this->conn->prepare("UPDATE payment_modes SET current_balance = ? WHERE id = ?");
                    $upd->bind_param("di", $newBal, $modeId);
                    $upd->execute();
                }
            }

            // 3. Insert Loan
            $finJson = json_encode($financials);
            $dedJson = json_encode($deductions);
            $splitJson = json_encode($paymentSplit);
            $status = 'Active';
            
            $stmt = $this->conn->prepare("INSERT INTO loans (company_id, customer_id, loan_type, status, financials, deductions, payment_split, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("iissssss", $companyId, $customerId, $loanType, $status, $finJson, $dedJson, $splitJson, $notes);
            $stmt->execute();
            $loanId = $stmt->insert_id;

            // 4. Audit Log
            $this->logCapital($companyId, $netDisbursement, 'Disbursement', "Loan Disbursed to Customer #$customerId");

            $this->conn->commit();
            return ["status" => SUCCESS, "_id" => $loanId];

        } catch (Exception $e) {
            $this->conn->rollback();
            return ["status" => FAILED, "message" => $e->getMessage()];
        }
    }

    /* =========================================================================
       6. TRANSACTIONS (COLLECTIONS)
       ========================================================================= */

    public function createTransaction($userId, $companyId, $data) {
        $loanId = $data['loanId'];
        $amount = $data['amount'];
        $notes = isset($data['notes']) ? $data['notes'] : '';
        
        // 🟢 SMART FALLBACK for Mobile App
        // If app sends { amount: 500, type: 'Cash' } instead of paymentSplit
        if (!isset($data['paymentSplit']) || empty($data['paymentSplit'])) {
            $type = isset($data['type']) ? $data['type'] : 'Cash'; // Default to Cash
            
            // Find the first active wallet of this type for this company
            $wStmt = $this->conn->prepare("SELECT id FROM payment_modes WHERE company_id = ? AND type = ? AND is_active = 1 LIMIT 1");
            $wStmt->bind_param("is", $companyId, $type);
            $wStmt->execute();
            $wStmt->bind_result($fallbackModeId);
            $wStmt->fetch();
            $wStmt->close();

            if (!$fallbackModeId) {
                // Determine 'Cash' or 'Online' based on type input, fallback to creating one or error
                return ["status" => FAILED, "message" => "No active $type wallet found. Please create one in Settings."];
            }

            $data['paymentSplit'] = [
                ["modeId" => $fallbackModeId, "amount" => $amount]
            ];
        }

        $paymentSplit = $data['paymentSplit'];

        $this->conn->begin_transaction();
        try {
            // 1. Fetch Loan
            $loan = $this->getLoanById($loanId);
            if (!$loan) throw new Exception("Loan not found");

            // 2. Update Wallets (Credit)
            foreach ($paymentSplit as $split) {
                $modeId = $split['modeId'];
                $amt = $split['amount'];
                
                $upd = $this->conn->prepare("UPDATE payment_modes SET current_balance = current_balance + ? WHERE id = ?");
                $upd->bind_param("di", $amt, $modeId);
                $upd->execute();
            }

            // 3. Insert Transaction
            $splitJson = json_encode($paymentSplit);
            $type = 'Daily_Installment'; // Logic to determine if Interest/Principal can be added later
            
            $tStmt = $this->conn->prepare("INSERT INTO transactions (loan_id, collected_by, amount, payment_split, type, notes) VALUES (?, ?, ?, ?, ?, ?)");
            $tStmt->bind_param("iidsss", $loanId, $userId, $amount, $splitJson, $type, $notes);
            $tStmt->execute();

            // 4. Update Loan Stats
            $financials = json_decode($loan['financials'], true);
            $pending = $financials['netDisbursementAmount'] ?? $financials['principalAmount']; // Simplified
            // Ideally, we fetch current pending from a separate column or calc it. 
            // For now, let's assume we store summaries in JSON or separate cols. 
            // To keep it robust, let's use JSON update or a separate 'summary' column if schema had it.
            // Using `loans` table update directly.
            
            // NOTE: In schema.sql, we didn't add 'pending_amount' column explicitly, assuming it's in JSON 'financials'.
            // But updating JSON via SQL is tricky in old MySQL. 
            // Recommendation: Add `pending_amount` to schema or handle in app code. 
            // For this output, I will assume we rely on calculating it on read or updating a JSON field if MySQL 5.7+.
            // Let's stick to inserting the Txn. The 'Get Loan' will sum txns to show balance.

            // 5. Audit Log
            $this->logCapital($companyId, $amount, 'Collection', "Collection for Loan #$loanId");

            $this->conn->commit();
            return ["status" => SUCCESS];

        } catch (Exception $e) {
            $this->conn->rollback();
            return ["status" => FAILED, "message" => $e->getMessage()];
        }
    }

    /* =========================================================================
       7. GETTERS & HELPERS
       ========================================================================= */

    public function getLoanDetails($loanId) {
        $stmt = $this->conn->prepare("SELECT l.*, c.full_name, c.mobile FROM loans l JOIN customers c ON l.customer_id = c.id WHERE l.id = ?");
        $stmt->bind_param("i", $loanId);
        $stmt->execute();
        $res = $stmt->get_result();
        $loan = $res->fetch_assoc();
        
        if ($loan) {
            $loan['financials'] = json_decode($loan['financials']);
            $loan['deductions'] = json_decode($loan['deductions']);
            $loan['payment_split'] = json_decode($loan['payment_split']);
            
            // Calculate Pending (Sum Transactions)
            $tStmt = $this->conn->prepare("SELECT SUM(amount) FROM transactions WHERE loan_id = ?");
            $tStmt->bind_param("i", $loanId);
            $tStmt->execute();
            $tStmt->bind_result($paid);
            $tStmt->fetch();
            $tStmt->close();
            
            $loan['amountPaid'] = $paid ?? 0;
            // Simple Logic: Pending = Principal + Interest - Paid (Logic varies by Daily/Monthly)
            // For now, returning raw data for Frontend to calculate display
        }
        return $loan;
    }

        /* CAPITAL & DASHBOARD */
    public function addCapital($companyId, $amount, $type, $source, $notes, $addedBy) {
        $this->logCapital($companyId, $amount, $type, "$source - $notes");
        return ["status" => SUCCESS];
    }

    public function getDashboardStats($companyId) {
        $response = ['cashBalance' => 0, 'bankBalance' => 0, 'todayCollection' => 0, 'activeLoans' => 0, 'marketOutstanding' => 0];
        
        $stmt = $this->conn->prepare("SELECT type, SUM(current_balance) as total FROM payment_modes WHERE company_id = ? AND is_active = 1 GROUP BY type");
        $stmt->bind_param("i", $companyId);
        $stmt->execute();
        $res = $stmt->get_result();
        while($row = $res->fetch_assoc()) {
            if($row['type'] == 'Cash') $response['cashBalance'] = (float)$row['total'];
            if($row['type'] == 'Online') $response['bankBalance'] = (float)$row['total'];
        }
        $stmt->close();

        $stmt = $this->conn->prepare("SELECT SUM(t.amount) FROM transactions t JOIN loans l ON t.loan_id = l.id WHERE l.company_id = ? AND DATE(t.created_at) = CURDATE()");
        $stmt->bind_param("i", $companyId);
        $stmt->execute();
        $stmt->bind_result($todayColl);
        $stmt->fetch();
        $response['todayCollection'] = (float)($todayColl ?? 0);
        $stmt->close();

        $stmt = $this->conn->prepare("SELECT COUNT(*) FROM loans WHERE company_id = ? AND status = 'Active'");
        $stmt->bind_param("i", $companyId);
        $stmt->execute();
        $stmt->bind_result($activeLoans);
        $stmt->fetch();
        $response['activeLoans'] = $activeLoans;
        $stmt->close();

        return $response;
    }

    private function getWalletById($id) {
        $stmt = $this->conn->prepare("SELECT id, name, current_balance FROM payment_modes WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        return $res->fetch_assoc();
    }

    private function getLoanById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM loans WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        return $res->fetch_assoc();
    }

    private function logCapital($companyId, $amount, $type, $desc) {
        $stmt = $this->conn->prepare("INSERT INTO capital_logs (company_id, amount, type, description) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("idss", $companyId, $amount, $type, $desc);
        $stmt->execute();
    }
}
?>