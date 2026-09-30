import { readFileSync } from 'node:fs'
import nodemailer from 'nodemailer'

const parseEnvFile = (file) => {
  if (!file) return {}
  try {
    return Object.fromEntries(readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=')
        const key = line.slice(0, separator).trim()
        const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
        return [key, value]
      }))
  } catch (error) {
    if (error?.code === 'ENOENT') return {}
    throw error
  }
}

const fileConfig = parseEnvFile(process.env.SMTP_CONFIG_FILE)
const setting = (name, fallback = '') => process.env[name] || fileConfig[name] || fallback
const smtpUser = setting('SMTP_USER')
const smtpPassword = setting('SMTP_PASSWORD').replace(/\s+/g, '')
const fromAddress = setting('MAIL_FROM_ADDRESS', smtpUser)
const fromName = setting('MAIL_FROM_NAME', 'PunjabShip')

export const isMailConfigured = () => Boolean(smtpUser && smtpPassword && fromAddress)
export const mailStatus = () => ({
  configured: isMailConfigured(),
  from: isMailConfigured() ? fromAddress : null,
})

let transporter
const getTransporter = () => {
  if (!isMailConfigured()) throw new Error('PunjabShip email delivery is not configured.')
  if (!transporter) {
    const port = Number(setting('SMTP_PORT', '465'))
    transporter = nodemailer.createTransport({
      host: setting('SMTP_HOST', 'smtp.gmail.com'),
      port,
      secure: setting('SMTP_SECURE', port === 465 ? 'true' : 'false') === 'true',
      auth: { user: smtpUser, pass: smtpPassword },
    })
  }
  return transporter
}

const from = () => ({ name: fromName, address: fromAddress })

export const verifyMailConnection = async () => getTransporter().verify()

export const sendOtpEmail = async ({ to, otp, expiresMinutes = 10 }) => getTransporter().sendMail({
  from: from(),
  to,
  subject: `${otp} is your PunjabShip verification code`,
  text: `Your PunjabShip verification code is ${otp}. It expires in ${expiresMinutes} minutes. If you did not request this code, you can ignore this email.`,
  html: `<!doctype html><html><body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#172033"><div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e6eaf0;border-radius:16px;overflow:hidden"><div style="background:#5a1831;color:#fff;padding:24px 30px"><h1 style="font-size:22px;margin:0">PunjabShip verification</h1></div><div style="padding:30px"><p style="font-size:16px;margin-top:0">Use this one-time code to sign in:</p><div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#5a1831;margin:24px 0">${otp}</div><p style="font-size:14px;color:#5d6677">This code expires in ${expiresMinutes} minutes. If you did not request it, you can safely ignore this email.</p></div></div></body></html>`,
})

export const sendPasswordResetEmail = async ({ to, otp, expiresMinutes = 10 }) => getTransporter().sendMail({
  from: from(),
  to,
  subject: `${otp} is your PunjabShip password reset code`,
  text: `Your PunjabShip password reset code is ${otp}. It expires in ${expiresMinutes} minutes. If you did not request a password reset, you can ignore this email.`,
  html: `<!doctype html><html><body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#172033"><div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e6eaf0;border-radius:16px;overflow:hidden"><div style="background:#5a1831;color:#fff;padding:24px 30px"><h1 style="font-size:22px;margin:0">Reset your PunjabShip password</h1></div><div style="padding:30px"><p style="font-size:16px;margin-top:0">Use this one-time code to continue:</p><div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#5a1831;margin:24px 0">${otp}</div><p style="font-size:14px;color:#5d6677">This code expires in ${expiresMinutes} minutes. If you did not request a password reset, you can safely ignore this email.</p></div></div></body></html>`,
})

export const sendTestEmail = async (to) => getTransporter().sendMail({
  from: from(),
  to,
  subject: 'PunjabShip email service is configured',
  text: 'PunjabShip email delivery is working correctly. OTP authentication emails will be sent from this account.',
  html: '<!doctype html><html><body style="font-family:Arial,sans-serif;color:#172033"><h2 style="color:#5a1831">PunjabShip email test successful</h2><p>Email delivery is working correctly. OTP authentication emails will be sent from this account.</p></body></html>',
})
