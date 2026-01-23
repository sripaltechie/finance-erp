<?php

require_once '../include/DbHandler.php';
require_once '../include/Config.php';
require_once '../include/JWT.php'; // Helper I added
require '.././libs/Slim/Slim.php';

\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();

// User ID from Token (Global)
$user_id = NULL;

/* =========================================================================
   AUTH ROUTES
   ========================================================================= */
$app->get('/apicheck', function() use ($app) {
        
	echoResponse(200, ["message" => "Api hit success"]);

});

// Client Register
$app->post('/auth/client/register', function() use ($app) {
    verifyRequiredParams(array('ownerName', 'email', 'mobile', 'password', 'businessName'));
    $json = $app->request->getBody();
    $data = json_decode($json, true);

    $db = new DbHandler();
    $res = $db->createClient($data['ownerName'], $data['email'], $data['mobile'], $data['password'], $data['businessName']);

    if ($res == USER_ALREADY_EXISTED) {
        echoResponse(400, ["message" => "User already exists"]);
    } else if ($res == SUCCESS) {
        echoResponse(201, ["message" => "Registration successful! Please contact Admin for approval."]);
    } else {
        echoResponse(500, ["message" => "An error occurred while registering"]);
    }
});

// Client Login
$app->post('/auth/client/login', function() use ($app) {
    verifyRequiredParams(array('identifier', 'password'));
    $json = $app->request->getBody();
    $data = json_decode($json, true);

    $db = new DbHandler();
    $res = $db->loginClient($data['identifier'], $data['password']);

    if ($res['status'] == SUCCESS) {
        // Generate Token
        $tokenPayload = ["id" => $res['user']['_id'], "role" => "Client"];
        $token = JWT::encode($tokenPayload, JWT_SECRET);
        
        echoResponse(200, [
            "token" => $token,
            "user" => $res['user']
        ]);
    } else if ($res['status'] == 'PENDING_APPROVAL') {
        echoResponse(403, ["message" => "Account Pending Approval"]);
    } else {
        echoResponse(401, ["message" => "Invalid Credentials"]);
    }
});

// 🟢 STAFF LOGIN (For Mobile App)
$app->post('/auth/staff/login', function() use ($app) {
    verifyRequiredParams(array('identifier', 'password')); // identifier = mobile
    $json = $app->request->getBody();
    $data = json_decode($json, true);

    $db = new DbHandler();
    $res = $db->loginStaff($data['identifier'], $data['password']);

    if ($res['status'] == SUCCESS) {
        // Token Payload
        $tokenPayload = [
            "id" => $res['user']['_id'], 
            "role" => $res['user']['role'],
            "companyId" => $res['user']['companyId']
        ];
        $token = JWT::encode($tokenPayload, JWT_SECRET);
        
        echoResponse(200, [
            "token" => $token,
            "companyId" => $res['user']['companyId'],
            "user" => $res['user']
        ]);
    } else if ($res['status'] == 'DEACTIVATED') {
        echoResponse(403, ["message" => "Account Deactivated. Contact Admin."]);
    } else {
        echoResponse(401, ["message" => "Invalid Credentials"]);
    }
});


/* =========================================================================
   COMPANY ROUTES
   ========================================================================= */

// Create Company
$app->post('/companies/create', 'authenticate', function() use ($app) {
    verifyRequiredParams(array('name', 'address', 'initialCapital'));
    $json = $app->request->getBody();
    $data = json_decode($json, true);
    
    global $user_id; // From middleware

    $db = new DbHandler();
    $settings = isset($data['settings']) ? $data['settings'] : new stdClass();
    
    $res = $db->createCompany($user_id, $data['name'], $data['address'], $data['initialCapital'], $settings);

    if ($res['status'] == SUCCESS) {
        echoResponse(201, ["message" => "Company created", "_id" => $res['_id']]);
    } else if ($res == PLAN_LIMIT_REACHED) {
        echoResponse(403, ["message" => "Plan Limit Reached! Upgrade to add more companies."]);
    } else {
        echoResponse(500, ["message" => "Creation failed: " . $res['error']]);
    }
});

// Get My Companies
$app->get('/companies', 'authenticate', function() use ($app) {
    global $user_id;
    $db = new DbHandler();
    $companies = $db->getMyCompanies($user_id);
    echoResponse(200, $companies);
});

/* =========================================================================
   PAYMENT MODES (Wallets)
   ========================================================================= */

// Get Payment Modes
$app->get('/companies/:id/payment-modes', 'authenticate', function($id) use ($app) {
    $db = new DbHandler();
    $modes = $db->getPaymentModes($id);
    echoResponse(200, $modes);
});

// Add Payment Mode
$app->post('/companies/:id/payment-modes', 'authenticate', function($id) use ($app) {
    verifyRequiredParams(array('name', 'type', 'initialBalance'));
    $json = $app->request->getBody();
    $data = json_decode($json, true);

    $db = new DbHandler();
    $res = $db->createPaymentMode($id, $data['name'], $data['type'], $data['initialBalance']);

    if ($res['status'] == SUCCESS) {
        echoResponse(201, ["message" => "Payment mode added", "_id" => $res['_id']]);
    } else {
        echoResponse(500, ["message" => "Failed to add payment mode"]);
    }
});

/* =========================================================================
   STAFF MANAGEMENT
   ========================================================================= */

// Create Staff
$app->post('/staff', 'authenticate', function() use ($app) {
    verifyRequiredParams(array('companyId', 'name', 'mobile', 'password', 'role'));
    $json = $app->request->getBody();
    $data = json_decode($json, true);

    $db = new DbHandler();
    $res = $db->createStaff($data['companyId'], $data['name'], $data['mobile'], $data['password'], $data['role']);

    if ($res == USER_ALREADY_EXISTED) {
        echoResponse(400, ["message" => "Mobile number already exists"]);
    } else if ($res == SUCCESS) {
        echoResponse(201, ["message" => "Staff created successfully"]);
    } else {
        echoResponse(500, ["message" => "Failed to create staff"]);
    }
});

// Get Staff by Company
$app->get('/staff/:companyId', 'authenticate', function($companyId) use ($app) {
    $db = new DbHandler();
    $staff = $db->getStaffByCompany($companyId);
    echoResponse(200, $staff);
});

/* =========================================================================
   CUSTOMER ROUTES
   ========================================================================= */

// Get All Customers (Supports ?search=)
$app->get('/customers', 'authenticate', function() use ($app) {
    global $user_id;
    // We need companyId. If user is Staff, get their companyId. If Client, get selected company?
    // For now, assuming user is Staff/Owner and we fetch based on their linked company.
    // NOTE: In your JWT, you store 'companyId' for Staff. For Client, they might need to pass it.
    // Let's assume the token has 'companyId' if Staff, or we pass it in headers.
    
    // Better approach matching your App Logic:
    // The App's 'searchCustomerService' calls /customers?search=...
    // We need to know WHICH company to search.
    // We will decode the token to find the company_id (if staff).
    
    $req = $app->request();
    $search = $req->get('search');
    
    // Decode token again to access payload details (or better, store in global during authenticate)
    $headers = apache_request_headers();
    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $user = JWT::decode($token, JWT_SECRET);
    
    $companyId = $user->companyId ?? null; 
    
    if(!$companyId && $user->role === 'Client') {
        // If Client (Owner), they should pass ?companyId=... or we default to first?
        // For simplicity, let's assume Client passes it or we pick first.
        // App seems to handle 'activeCompanyId' in storage.
        // Let's use a header or query param if provided, else fail.
        $companyId = $req->get('companyId');
    }

    if (!$companyId) {
        echoResponse(400, ["message" => "Company ID required"]);
        return;
    }

    $db = new DbHandler();
    $customers = $db->getCustomers($companyId, $search);
    echoResponse(200, $customers);
});

// Create Customer
$app->post('/customers', 'authenticate', function() use ($app) {
    verifyRequiredParams(array('fullName', 'mobile', 'companyId'));
    $json = $app->request->getBody();
    $data = json_decode($json, true);

    $db = new DbHandler();
    
    // Prepare nested objects (default to empty if missing)
    $locations = $data['locations'] ?? new stdClass();
    $kyc = $data['kyc'] ?? new stdClass();
    $family = $data['familyMembers'] ?? [];
    $shortId = $data['shortId'] ?? "";
    global $user_id; // Created By

    $res = $db->createCustomer($data['companyId'], $data['fullName'], $data['mobile'], $shortId, $locations, $kyc, $family, $user_id);

    if ($res == USER_ALREADY_EXISTED) {
        echoResponse(400, ["message" => "Customer with this mobile already exists."]);
    } else if ($res['status'] == SUCCESS) {
        echoResponse(201, ["message" => "Customer created", "_id" => $res['_id']]);
    } else {
        echoResponse(500, ["message" => "Failed to create customer"]);
    }
});

// Check Conflict
$app->post('/customers/check-conflict', 'authenticate', function() use ($app) {
    $json = $app->request->getBody();
    $data = json_decode($json, true);
    
    $ration = $data['rationCardNumber'] ?? '';
    $mobile = $data['mobile'] ?? '';

    $db = new DbHandler();
    $res = $db->checkConflict($ration, $mobile);
    
    echoResponse(200, $res);
});

// Get Single Customer
$app->get('/customers/:id', 'authenticate', function($id) use ($app) {
    $db = new DbHandler();
    $customer = $db->getCustomerById($id);
    if ($customer) {
        echoResponse(200, $customer);
    } else {
        echoResponse(404, ["message" => "Customer not found"]);
    }
});

// Update Customer
$app->put('/customers/:id', 'authenticate', function($id) use ($app) {
    $json = $app->request->getBody();
    $data = json_decode($json, true);

    $db = new DbHandler();
    $res = $db->updateCustomer($id, $data);

    if ($res['status'] == SUCCESS) {
        echoResponse(200, ["message" => "Customer updated"]);
    } else {
        echoResponse(500, ["message" => "Update failed"]);
    }
});


/* =========================================================================
   LOAN ROUTES
   ========================================================================= */

// Create Loan
$app->post('/loans/create-advanced', 'authenticate', function() use ($app) {
    verifyRequiredParams(array('companyId', 'customerId', 'loanType', 'financials'));
    $json = $app->request->getBody();
    $data = json_decode($json, true);
    
    global $user_id;

    $db = new DbHandler();
    $res = $db->createAdvancedLoan($data['companyId'], $data['customerId'], $data, $user_id);

    if ($res['status'] == SUCCESS) {
        echoResponse(201, ["message" => "Loan created successfully", "_id" => $res['_id']]);
    } else {
        echoResponse(500, ["message" => "Failed: " . $res['message']]);
    }
});

// Get Loan Details
$app->get('/loans/:id', 'authenticate', function($id) use ($app) {
    $db = new DbHandler();
    $loan = $db->getLoanDetails($id);
    
    if ($loan) {
        // Calculate Stats for Frontend (Simplified)
        $stats = [
            "isOverdue" => false, 
            "overdueDays" => 0, 
            "penaltyAmt" => 0 
        ];
        echoResponse(200, ["loan" => $loan, "stats" => $stats]);
    } else {
        echoResponse(404, ["message" => "Loan not found"]);
    }
});

/* =========================================================================
   TRANSACTION ROUTES
   ========================================================================= */

// Create Transaction (Collection)
$app->post('/transactions', 'authenticate', function() use ($app) {
    verifyRequiredParams(array('loanId', 'amount'));
    $json = $app->request->getBody();
    $data = json_decode($json, true);
    
    global $user_id;
    
    // We need Company ID to find wallets if using Fallback
    // Decode token again or use passed param? 
    // Best practice: Frontend sends it, or we fetch from Loan.
    // Let's fetch from User Token if available (Staff)
    $headers = apache_request_headers();
    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $user = JWT::decode($token, JWT_SECRET);
    $companyId = $user->companyId ?? $data['companyId'];

    if (!$companyId) {
        echoResponse(400, ["message" => "Company ID Context Missing"]);
        return;
    }

    $db = new DbHandler();
    $res = $db->createTransaction($user_id, $companyId, $data);

    if ($res['status'] == SUCCESS) {
        echoResponse(201, ["message" => "Payment collected successfully"]);
    } else {
        echoResponse(500, ["message" => "Failed: " . $res['message']]);
    }
});

// Repayment Wrapper (For Web App compatibility)
$app->post('/loans/:id/repayment', 'authenticate', function($id) use ($app) {
    $json = $app->request->getBody();
    $data = json_decode($json, true);
    $data['loanId'] = $id; // Inject ID
    
    // Reuse the transaction logic
    // ... (Repeat logic or redirect internally)
    // For simplicity, just call the same flow:
    
    global $user_id;
    $headers = apache_request_headers();
    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $user = JWT::decode($token, JWT_SECRET);
    $companyId = $user->companyId ?? $data['companyId'];

    $db = new DbHandler();
    $res = $db->createTransaction($user_id, $companyId, $data);

    if ($res['status'] == SUCCESS) {
        echoResponse(201, ["message" => "Repayment recorded"]);
    } else {
        echoResponse(500, ["message" => "Failed: " . $res['message']]);
    }
});

/* =========================================================================
   HELPER FUNCTIONS
   ========================================================================= */

/**
 * Verifying required params posted or not
 */
function verifyRequiredParams($required_fields) {
    $error = false;
    $error_fields = "";
    $request_params = array();
    $request_params = $_REQUEST;
    
    // Handling PUT request params
    if ($_SERVER['REQUEST_METHOD'] == 'PUT') {
        $app = \Slim\Slim::getInstance();
        parse_str($app->request()->getBody(), $request_params);
    }
    
    // Handling JSON Payload
    $app = \Slim\Slim::getInstance();
    $body = $app->request->getBody();
    $json_params = json_decode($body, true);
    if(is_array($json_params)) {
        $request_params = array_merge($request_params, $json_params);
    }

    foreach ($required_fields as $field) {
        if (!isset($request_params[$field]) || strlen(trim($request_params[$field])) <= 0) {
            $error = true;
            $error_fields .= $field . ', ';
        }
    }

    if ($error) {
        $response = array();
        $app = \Slim\Slim::getInstance();
        $response["error"] = true;
        $response["message"] = 'Required field(s) ' . substr($error_fields, 0, -2) . ' is missing or empty';
        echoResponse(400, $response);
        $app->stop();
    }
}

/**
 * Echoing json response to client
 */
function echoResponse($status_code, $response) {
    $app = \Slim\Slim::getInstance();
    $app->status($status_code);
    $app->contentType('application/json');
    echo json_encode($response);
}

/**
 * Authentication Middleware
 */
function authenticate(\Slim\Route $route) {
    $headers = apache_request_headers();
    $response = array();
    $app = \Slim\Slim::getInstance();

    if (isset($headers['Authorization'])) {
        $token = str_replace("Bearer ", "", $headers['Authorization']);
        try {
            $decoded = JWT::decode($token, JWT_SECRET);
            if ($decoded) {
                global $user_id;
                $user_id = $decoded->id; // Set Global User ID
            } else {
                echoResponse(401, ["message" => "Access Denied. Invalid Token"]);
                $app->stop();
            }
        } catch (Exception $e) {
            echoResponse(401, ["message" => "Access Denied. Token Error"]);
            $app->stop();
        }
    } else {
        echoResponse(400, ["message" => "Token is missing"]);
        $app->stop();
    }
}

$app->run();
?>