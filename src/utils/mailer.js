import nodemailer from 'nodemailer';

// Configure the email transport
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password',
    },
});

/**
 * Send booking assignment email to technician
 */
export const sendBookingNotificationToTechnician = async (technician, booking, serviceName) => {
    if (!technician.email) {
        console.log(`[Mailer] Technician ${technician.full_name} has no email. Skipping.`);
        return;
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'no-reply@fixmyhomepro.com',
            to: technician.email,
            subject: `New Job Available: ${serviceName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #09172e; padding: 20px; text-align: center;">
                        <h1 style="color: #facc15; margin: 0;">FIXPRO</h1>
                    </div>
                    <div style="padding: 30px; background: #f9fafb;">
                        <h2 style="color: #09172e;">Hello ${technician.full_name},</h2>
                        <p>A new <strong>${serviceName}</strong> job is available near you!</p>
                        
                        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                            <h3 style="margin-top: 0; color: #09172e;">Booking Details</h3>
                            <p><strong>Date:</strong> ${booking.booking_date}</p>
                            <p><strong>Time:</strong> ${booking.booking_time}</p>
                            <p><strong>Address:</strong> ${booking.customer_address}</p>
                            <p><strong>Estimated Price:</strong> ₹${booking.estimated_price}</p>
                        </div>
                        
                        <p>Open your technician dashboard to accept or reject this job.</p>
                        <p style="color: #6b7280; font-size: 14px;">— FixMyHome Pro Team</p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Mailer] Email sent to technician ${technician.email}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[Mailer] Failed to send to ${technician.email}:`, error.message);
    }
};

/**
 * Send booking confirmation email to customer
 */
export const sendBookingConfirmationToCustomer = async (customer, booking, serviceName) => {
    if (!customer.email) {
        console.log(`[Mailer] Customer has no email. Skipping.`);
        return;
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'no-reply@fixmyhomepro.com',
            to: customer.email,
            subject: `Booking Confirmed: ${serviceName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #09172e; padding: 20px; text-align: center;">
                        <h1 style="color: #facc15; margin: 0;">FIXPRO</h1>
                    </div>
                    <div style="padding: 30px; background: #f9fafb;">
                        <h2 style="color: #09172e;">Booking Confirmed! 🎉</h2>
                        <p>Hi ${customer.full_name},</p>
                        <p>Your <strong>${serviceName}</strong> service has been booked successfully!</p>
                        
                        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                            <h3 style="margin-top: 0; color: #09172e;">Booking Summary</h3>
                            <p><strong>Service:</strong> ${serviceName}</p>
                            <p><strong>Date:</strong> ${booking.booking_date}</p>
                            <p><strong>Time:</strong> ${booking.booking_time}</p>
                            <p><strong>Address:</strong> ${booking.customer_address}</p>
                            <p><strong>Amount Paid:</strong> ₹${booking.estimated_price}</p>
                        </div>
                        
                        <p>A technician will be assigned shortly. You'll receive a notification once confirmed.</p>
                        <p style="color: #6b7280; font-size: 14px;">— FixMyHome Pro Team</p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Mailer] Confirmation email sent to ${customer.email}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[Mailer] Failed to send confirmation to ${customer.email}:`, error.message);
    }
};
