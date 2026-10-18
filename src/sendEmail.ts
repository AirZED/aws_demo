import nodemailer from "nodemailer";

const password = "123456789"
const email = "me@gmail.com"

const transporter = nodemailer.createTransport({
    host: "smtp.example.com",
    port: 587,
    secure: false, // Start unencrypted, upgrade via STARTTLS
    auth: {
        user: email,
        pass: password,
    },
});

