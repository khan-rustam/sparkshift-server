import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
// import logo from "./assets/logo.png";

dotenv.config();

const app = express();
const emailQueue = [];
let isProcessingQueue = false;

app.use(cors());
app.use(express.json());

// Email configuration with improved reliability
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST_SMTP,
  port: process.env.EMAIL_PORT_SMTP,
  secure: true,
  auth: {
    user: process.env.EMAIL_ADMIN,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
  pool: true,
  maxConnections: 3, // Reduced from 5 to prevent overwhelming the server
  maxMessages: 50, // Reduced from 100 for better stability
  rateDelta: 1000, // Minimum time between messages in milliseconds
  rateLimit: 5, // Maximum number of messages per rateDelta
  connectionTimeout: 10000, // Increased timeout to 10 seconds
  greetingTimeout: 10000, // Increased timeout to 10 seconds
  socketTimeout: 15000, // Added socket timeout
  debug: true, // Enable debug logging
});

// Only verify connection in development
if (process.env.NODE_ENV === "development") {
  transporter.verify(function (error, success) {
    if (error) {
      console.error("SMTP connection error:", error);
    } else {
      console.log("Server is ready to take messages");
    }
  });
}

// Process email queue with retry logic
async function processEmailQueue() {
  if (isProcessingQueue || emailQueue.length === 0) return;

  isProcessingQueue = true;

  while (emailQueue.length > 0) {
    const mailOptions = emailQueue.shift();
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
        success = true;
      } catch (error) {
        retries--;
        console.error(`Email sending error (${retries} retries left):`, error);
        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, (3 - retries) * 2000)
          );
        } else {
          // If all retries failed, log the final error
          console.error("Failed to send email after all retries:", error);
          // Put the failed email back in queue if it's important
          if (mailOptions.to === process.env.EMAIL_ADMIN) {
            emailQueue.push(mailOptions);
          }
        }
      }
    }
  }

  isProcessingQueue = false;
}

// Increase the interval between queue processing attempts
setInterval(processEmailQueue, 1000); // Changed from 100ms to 1000ms

app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation to fail fast if data is missing
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Email to admin
  const adminMailOptions = {
    from: process.env.EMAIL_ADMIN,
    to: process.env.EMAIL_ADMIN,
    subject: `${subject} - from ${name} `,
    html: `
     <div
  style="background-color: #ffffff; color: #333333; padding: 30px;  max-width: 600px;margin: 0 auto;">
  <div
    style="background-color: #f4f4f4;  padding: 20px; align-items: center;  border-radius: 10px;   margin-bottom: 20px;" >
    <div style="color: #333333; font-size: 24px; font-weight: bold text-align: center align-items: center">
      <img src='https://sjc04pap002files.storage.live.com/y4m43oy5oMyJ-bICNOcqBY-iXabBo4pEf8anVUDy8ZTz6g6kxwVYlSP2-Ipjs0YR0CPszB03XoQ7BEcZQfVAfWfyWfs2G3sTwpleSgzgAdbESHR6xSpjNJYvd2nKVnTrg5Po81YgRr2oGj_8H7Fg8I8pCvS0SsctEFi9UPBTFLHgDyPnGDzuiAbOQ8iSjSyV45tushn_IBWNz-mo-YXcQcxddPT-OAT-I23Sn0ScyGKIGY?encodeFailures=1&width=1547&height=384' alt="Sparkshift" style="height: 50px; margin-bottom: 15px; filter: drop-shadow(0 4px 6px rgba(130, 87, 229, 0.2));">
  </div>
  <div
    style=" background-color: #ffffff;padding: 30px;  border-radius: 10px; margin-bottom: 20px; border: 1px solid #e0e0e0;  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); " >
    <h2 style="color: #9333ea; margin-top: 0">New Contact Form Submission</h2>

    <div style="margin-bottom: 15px">
      <div style="color: #9333ea; font-weight: bold; margin-bottom: 5px">
        Name
      </div>
      <div
        style="color: #333333; background-color: #f9f9f9; padding: 10px;border-radius: 5px;">
        ${name}
      </div>
    </div>
    <div style="margin-bottom: 15px">
      <div style="color: #9333ea; font-weight: bold; margin-bottom: 5px">
        Email
      </div>
      <div
      style="color: #333333; background-color: #f9f9f9; padding: 10px;border-radius: 5px;">
        ${email}
      </div>
    </div>
    <div style="margin-bottom: 15px">
      <div style="color: #9333ea; font-weight: bold; margin-bottom: 5px">
        Subject
      </div>
      <div
      style="color: #333333; background-color: #f9f9f9; padding: 10px;border-radius: 5px;">
        ${subject}
      </div>
    </div>
    <div style="margin-bottom: 15px">
      <div style="color: #9333ea; font-weight: bold; margin-bottom: 5px">
        Message
      </div>
      <div
      style="color: #333333; background-color: #f9f9f9; padding: 10px;border-radius: 5px; white-space: pre-wrap; " >
        ${message}
      </div>
    </div>

    <div class="button-container" style="text-align: center; margin-top: 20px">
      <a
        href="mailto:${email}?subject=Re: ${subject}"
        class="button"
        style=" display: inline-block;  background-color: #9333ea; color: #ffffff; padding: 12px 25px;  text-decoration: none; border-radius: 5px;   transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);  " >
        Reply to Message
      </a>
    </div>
  </div>

  <div
    class="footer"
    style=" text-align: center; color: #666666;  font-size: 14px;  margin-top: 30px; "
  >
    <p>This message was recieved on ${new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</p>
    <p> 2024 SparkShift. All rights reserved.</p>
  </div>
</div>`,
  };

  // Thank you email to user
  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Thank you for contacting Sparkshift`,
    html: `
    <div style="background-color: #ffffff; color: #333333; padding: 30px; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f4f4f4; padding: 20px; align-items: center; border-radius: 10px; margin-bottom: 20px;">
        <div style="color: #333333; font-size: 24px; font-weight: bold; text-align: center; align-items: center">
          <img src='https://sjc04pap002files.storage.live.com/y4m43oy5oMyJ-bICNOcqBY-iXabBo4pEf8anVUDy8ZTz6g6kxwVYlSP2-Ipjs0YR0CPszB03XoQ7BEcZQfVAfWfyWfs2G3sTwpleSgzgAdbESHR6xSpjNJYvd2nKVnTrg5Po81YgRr2oGj_8H7Fg8I8pCvS0SsctEFi9UPBTFLHgDyPnGDzuiAbOQ8iSjSyV45tushn_IBWNz-mo-YXcQcxddPT-OAT-I23Sn0ScyGKIGY?encodeFailures=1&width=1547&height=384' alt="Sparkshift" style="height: 50px; margin-bottom: 15px; filter: drop-shadow(0 4px 6px rgba(130, 87, 229, 0.2));">
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e0e0e0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
          <h2 style="color: #9333ea; margin-top: 0">Thank You for Reaching Out!</h2>
          <p style="color: #333333; line-height: 1.6;">
            Dear ${name},
          </p>
          <p style="color: #333333; line-height: 1.6;">
            Thank you for contacting Sparkshift. We have received your message and our team will review it shortly. We appreciate your interest and will get back to you as soon as possible.
          </p>
          <p style="color: #333333; line-height: 1.6;">
            Best regards,<br/>
            The Sparkshift Team
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://sparkshift.digital" 
               style="display: inline-block; 
                      background-color: #9333ea; 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 6px;
                      font-weight: 500;
                      transition: background-color 0.3s ease;">
              Explore More
            </a>
          </div>
        </div>
      </div>
    </div>
    `,
  };

  try {
    // Add both emails to the queue
    emailQueue.push(adminMailOptions);
    emailQueue.push(userMailOptions);

    res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending message" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
