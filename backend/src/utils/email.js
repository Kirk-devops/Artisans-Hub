const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter;

// Initialize email transporter
const initializeTransporter = () => {
  if (transporter) return transporter;

  try {
    if (process.env.EMAIL_SERVICE === 'gmail') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    } else {
      // Generic SMTP configuration
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }

    logger.info('Email transporter initialized');
    return transporter;
  } catch (error) {
    logger.error('Failed to initialize email transporter:', error);
    throw error;
  }
};

/**
 * Send email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {string} text - Plain text content (optional)
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async (to, subject, html, text = null) => {
  try {
    const smtp = initializeTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    if (text) {
      mailOptions.text = text;
    }

    const info = await smtp.sendMail(mailOptions);

    logger.info(`Email sent to ${to}: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
};

/**
 * Send bulk emails
 * @param {Array} recipients - Array of recipient emails
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise<Array>} Results for each email
 */
const sendBulkEmails = async (recipients, subject, html) => {
  try {
    const results = [];

    for (const email of recipients) {
      try {
        const result = await sendEmail(email, subject, html);
        results.push({ email, success: true, ...result });
      } catch (error) {
        logger.error(`Failed to send bulk email to ${email}:`, error);
        results.push({ email, success: false, error: error.message });
      }
    }

    return results;
  } catch (error) {
    logger.error('Bulk email error:', error);
    throw error;
  }
};

/**
 * Send welcome email
 * @param {string} email - User email
 * @param {string} firstName - User first name
 * @param {string} userType - User type (artisan/employer)
 */
const sendWelcomeEmail = async (email, firstName, userType) => {
  const subject = 'Welcome to Artisans Hub!';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .feature { margin: 15px 0; padding: 10px; background-color: white; border-left: 4px solid #007bff; }
          .button { display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Artisans Hub, ${firstName}!</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Thank you for joining Artisans Hub! We're excited to have you on board.</p>
            
            ${userType === 'artisan' ? `
              <h2>Getting Started as an Artisan:</h2>
              <div class="feature">
                <strong>Complete Your Profile</strong> - Add your skills, experience, and daily rates
              </div>
              <div class="feature">
                <strong>Browse Jobs</strong> - Find work opportunities posted by employers
              </div>
              <div class="feature">
                <strong>Accept Jobs</strong> - Choose jobs that match your skills
              </div>
              <div class="feature">
                <strong>Get Paid</strong> - Receive payment via Mobile Money after job completion
              </div>
            ` : `
              <h2>Getting Started as an Employer:</h2>
              <div class="feature">
                <strong>Post a Job</strong> - Describe the work you need done
              </div>
              <div class="feature">
                <strong>Select an Artisan</strong> - Browse verified artisans and choose the best fit
              </div>
              <div class="feature">
                <strong>Make Payment</strong> - Pay securely through our platform
              </div>
              <div class="feature">
                <strong>Rate & Review</strong> - Share your experience after job completion
              </div>
            `}

            <a href="${process.env.FRONTEND_WEB_URL}/dashboard" class="button">Go to Dashboard</a>

            <div class="footer">
              <p>If you have any questions, visit our FAQ or contact support@artisanshub.gh</p>
              <p>&copy; 2026 Artisans Hub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, subject, html);
};

/**
 * Send job notification email
 * @param {string} email - Recipient email
 * @param {Object} jobData - Job information
 */
const sendJobNotificationEmail = async (email, jobData) => {
  const subject = `New Job Available: ${jobData.workType}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .job-details { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-left: 4px solid #007bff; }
          .job-detail-item { margin: 10px 0; }
          .label { font-weight: bold; }
          .button { display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Job Opportunity!</h1>
          </div>
          <div class="job-details">
            <div class="job-detail-item">
              <span class="label">Work Type:</span> ${jobData.workType}
            </div>
            <div class="job-detail-item">
              <span class="label">Location:</span> ${jobData.location}
            </div>
            <div class="job-detail-item">
              <span class="label">Duration:</span> ${jobData.duration} days
            </div>
            <div class="job-detail-item">
              <span class="label">Daily Rate:</span> ${jobData.dailyRate} GHC
            </div>
            <div class="job-detail-item">
              <span class="label">Total Cost:</span> ${jobData.totalCost} GHC
            </div>
            <div class="job-detail-item">
              <span class="label">Description:</span> ${jobData.description}
            </div>
            <a href="${process.env.FRONTEND_WEB_URL}/jobs/${jobData.jobId}" class="button">View & Apply</a>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, subject, html);
};

/**
 * Send payment confirmation email
 * @param {string} email - Recipient email
 * @param {Object} paymentData - Payment information
 */
const sendPaymentConfirmationEmail = async (email, paymentData) => {
  const subject = 'Payment Confirmation - Artisans Hub';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .details-box { background-color: #f9f9f9; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .total-row { font-weight: bold; border-top: 2px solid #ddd; padding-top: 10px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Successful! ✓</h1>
          </div>
          <div class="details-box">
            <p>Hi ${paymentData.recipientName},</p>
            <p>Your payment has been received and processed successfully.</p>
            
            <h2>Payment Details:</h2>
            <div class="detail-row">
              <span>Transaction ID:</span>
              <span><strong>${paymentData.transactionRef}</strong></span>
            </div>
            <div class="detail-row">
              <span>Amount:</span>
              <span><strong>${paymentData.amount} GHC</strong></span>
            </div>
            <div class="detail-row">
              <span>Commission (15%):</span>
              <span>${paymentData.commission} GHC</span>
            </div>
            <div class="detail-row total-row">
              <span>You Paid:</span>
              <span>${paymentData.amount} GHC</span>
            </div>
            
            <p style="margin-top: 20px;">Payment Status: <strong style="color: #28a745;">CONFIRMED</strong></p>
            <p>The work will commence as per the agreed schedule.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, subject, html);
};

module.exports = {
  initializeTransporter,
  sendEmail,
  sendBulkEmails,
  sendWelcomeEmail,
  sendJobNotificationEmail,
  sendPaymentConfirmationEmail
};
