const nodemailer = require('nodemailer');
const config = require('../../config');
const PortalEmailModel = require('../models/emailModel');
const { SEND_MARK, EMAIL_STATUS } = require('../utils/authStateEnum');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport(config.mail);
  }

  // send alarm mail
  async sendAlarmMail(subject, message) {
    let to = config.alarm.mailto;
    if (to.length <= 0) return;
    let params = {
      "async": false,
      "to": to,
      "subject": subject,
      "text": message,
      "html": `<p>${message}</p>`
    };
    await this.sendEmail(params);
  }

  // send email
  async sendEmail(params) {
    let response = {
      emailStatus : EMAIL_STATUS.FAILED,
      async: params.async,
      desc: ''
    };
    // 1. save information
    await this._saveEmailInfor(params);

    // 2. send email
    if (!params.async) {
      let sendRes = await this.send(params);
      response.emailStatus = sendRes.emailStatus;
      response.desc = sendRes.desc;
    }

    return response;
  }

  async _saveEmailInfor(params) {
    let sendMark = params.async ? SEND_MARK.ALREADY_SENT : SEND_MARK.WAIT_TO_SEND;
    const emailInfo = new PortalEmailModel({
      send_mark: sendMark,
      email_detail: {
        async: params.async,
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        text: params.text,
        html: params.html,
        attachments: params.attachments,
      },
      email_status: {},
    });
    const doc = await emailInfo.save();
    params._emailId = doc._id;
  }

  async send(params) {
    let attachments = [];
    if (params.attachments && params.attachments.length > 0) {
      attachments = params.attachments.map(att => {
        return {
          filename: att.filename,
          content: att.content,
          encoding: 'base64',
        };
      });
    }
    // setup email data with unicode symbols
    const mailOptions = {
      from: `${config.mail.displayName} <${config.mail.auth.user}>`, // sender address
      to: params.to, // list of receivers
      cc: params.cc || [], // list of receivers
      bcc: params.bcc || [], // list of receivers
      subject: params.subject, // Subject line
      text: params.text, // plain text body
      html: params.html, // html body
      attachments,
    };
    let response;
    try {
      response = await this.transporter.sendMail(mailOptions);
      if (params._emailId) {
        await PortalEmailModel.findByIdAndUpdate(
          params._emailId,
          {
            $set: {
              email_status: {
                accepted: response.accepted,
                rejected: response.rejected,
                envelope: response.envelope,
                response: response.response,
                messageId: response.messageId,
              },
            },
          }
        ).exec();
      }
      return {
        emailStatus: EMAIL_STATUS.SUCCESS,
        desc: response
      };
    } catch (error) {
      return {
        emailStatus: EMAIL_STATUS.FAILED,
        desc: error,
      };
    }
  }

}

module.exports = new EmailService();


