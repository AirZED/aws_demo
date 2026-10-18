import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.example.com",
    port: 587,
    secure: false, // Start unencrypted, upgrade via STARTTLS
    auth: {
        user: "me@gmail.com",
        pass: "12345689",
    },
});