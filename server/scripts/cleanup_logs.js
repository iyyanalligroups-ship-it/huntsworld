const fs = require('fs');
const path = require('path');

const filesToProcess = [
    "Huntsworld/server/controllers/accessController.js",
    "Huntsworld/server/controllers/addressController.js",
    "Huntsworld/server/controllers/bannerPaymentController.js",
    "Huntsworld/server/controllers/buyLeadController.js",
    "Huntsworld/server/controllers/categoryController.js",
    "Huntsworld/server/controllers/complaintFormController.js",
    "Huntsworld/server/controllers/couponsNotificationController.js",
    "Huntsworld/server/controllers/ebookPaymentController.js",
    "Huntsworld/server/controllers/faqTopicController.js",
    "Huntsworld/server/controllers/favoriteProductController.js",
    "Huntsworld/server/controllers/grocerySellerController.js",
    "Huntsworld/server/controllers/grocerySellerRequirementController.js",
    "Huntsworld/server/controllers/helpRequestController.js",
    "Huntsworld/server/controllers/merchantController.js",
    "Huntsworld/server/controllers/messageController.js",
    "Huntsworld/server/controllers/newsController.js",
    "Huntsworld/server/controllers/permissionRequestedController.js",
    "Huntsworld/server/controllers/permissionRequestReadMappingController.js",
    "Huntsworld/server/controllers/phoneNumberAccessController.js",
    "Huntsworld/server/controllers/pointsController.js",
    "Huntsworld/server/controllers/postByRequirementController.js",
    "Huntsworld/server/controllers/productController.js",
    "Huntsworld/server/controllers/productQuoteController.js",
    "Huntsworld/server/controllers/razorpayWebhookController.js",
    "Huntsworld/server/controllers/redeemPointsController.js",
    "Huntsworld/server/controllers/studentController.js",
    "Huntsworld/server/controllers/subadminAccessRequestController.js",
    "Huntsworld/server/controllers/subscriptionPlanElementController.js",
    "Huntsworld/server/controllers/subscriptionPlanElementMappingController.js",
    "Huntsworld/server/controllers/testimonialController.js",
    "Huntsworld/server/controllers/topListingPlanPaymentController.js",
    "Huntsworld/server/controllers/trendingPointsPaymentController.js",
    "Huntsworld/server/controllers/trustSealRequestController.js",
    "Huntsworld/server/controllers/updateSmartSuggestions.js",
    "Huntsworld/server/controllers/userController.js",
    "Huntsworld/server/controllers/userSubscriptionPlanController.js",
    "Huntsworld/server/controllers/viewPointsController.js",
    "Huntsworld/server/models/serviceProviderModel.js",
    "Huntsworld/server/models/userSubscriptionPlanModel.js",
    "Huntsworld/server/utils/createFreeTrustSeal.js",
    "Huntsworld/server/utils/createGlobalOthers.js",
    "Huntsworld/server/utils/sendEmail.js",
    "Huntsworld/server/utils/subscriptionPlanExpire.js",
    "Huntsworld/server/utils/subscriptionPlanSendEmail.js",
    "Huntsworld/server/utils/TrustSealExpireJob.js"
];

const basePath = "d:/projects/final-huntsworld";

// Regex to match console.log statements (more inclusive)
const consoleLogRegex = /console\.log\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)\s*;?/g;

filesToProcess.forEach(relPath => {
    const absPath = path.join(basePath, relPath);
    if (fs.existsSync(absPath)) {
        try {
            const content = fs.readFileSync(absPath, 'utf8');
            const lines = content.split('\n');
            const newLines = lines.filter(line => !line.trim().startsWith('console.log('));
            
            if (lines.length !== newLines.length) {
                fs.writeFileSync(absPath, newLines.join('\n'), 'utf8');
                console.log(`✅ Processed: ${relPath}`);
            } else {
                console.log(`ℹ️ No console.log lines found in: ${relPath}`);
            }
        } catch (err) {
            console.error(`❌ Error processing ${relPath}:`, err.message);
        }
    } else {
        console.error(`❌ File not found: ${relPath}`);
    }
});
