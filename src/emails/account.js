const { createTransport } = require("nodemailer");

const sendMail = (to, subject, text) => {
  const transporter = createTransport({
    host: "smtp-relay.sendinblue.com",
    port: 587,
    auth: {
      user: process.env.BREVO_MAIL,
      pass: process.env.BREVO_PASS,
    },
  });

  const mailOptions = {
    from: process.env.BREVO_MAIL,
    to, //Mail user
    subject, // Subject of mail
    text, //Mail content
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = sendMail;

/*
app.brevo.com
name: my-mailer
api-key: xsmtpsib-ac80d0cc2597e983b275736e7109e4a2f3435dddb9c8cfc3e50493f68ad94ac2-I8bBSynpQRPXAfLY
smpt-server: smtp-relay.brevo.com
port: 587
login: roadmap.rdmp@gmail.com
*/
