// Pseudo-code concept
const verifyCompany = (req, res, next) => {
    // 1. Decrypt Token
    const user = decodeToken(req.headers.authorization);
    
    // 2. Attach Company ID to the Request Object
    req.user = user;
    req.companyId = user.companyId; 
    
    next();
};