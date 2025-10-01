const nodemailer = require('nodemailer');

// Email service
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

class NotificationService {
  // Send email
  async sendEmail({ to, subject, text, html }) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html
      };
      
      const result = await emailTransporter.sendMail(mailOptions);
      console.log('Email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email error:', error);
      throw error;
    }
  }

  // Send Discord notification
  async sendDiscordNotification(message) {
    try {
      if (!process.env.DISCORD_WEBHOOK) {
        throw new Error('Discord webhook not configured');
      }
      
      const response = await fetch(process.env.DISCORD_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message,
          username: 'Portfolio Bot'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`);
      }
      
      console.log('Discord notification sent');
      return response;
    } catch (error) {
      console.error('Discord error:', error);
      throw error;
    }
  }

  // Send contact form notification
  async sendContactNotification(contactData) {
    const { name, email, message } = contactData;
    
    // Email to admin
    await this.sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    });

    // Discord notification
    if (process.env.DISCORD_WEBHOOK) {
      await this.sendDiscordNotification(
        `📧 New contact form submission from **${name}** (${email})`
      );
    }
  }

  // Send project click notification
  async sendProjectClickNotification(projectTitle, clickCount) {
    const message = `🎯 Project "${projectTitle}" reached ${clickCount} clicks!`;
    
    if (clickCount % 10 === 0) { // Notify every 10 clicks
      if (process.env.DISCORD_WEBHOOK) {
        await this.sendDiscordNotification(message);
      }
    }
  }

  // Send blog post notification
  async sendBlogNotification(blogPost) {
    const message = `📝 New blog post published: "${blogPost.title}"`;
    
    if (process.env.DISCORD_WEBHOOK) {
      await this.sendDiscordNotification(message);
    }
  }

  // Send achievement notification
  async sendAchievementNotification(achievement) {
    const message = `🏆 New achievement unlocked: "${achievement.title}"`;
    
    if (process.env.DISCORD_WEBHOOK) {
      await this.sendDiscordNotification(message);
    }
  }
}

module.exports = new NotificationService();