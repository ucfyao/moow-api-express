const nodemailer = require('nodemailer');
const config = require('../../config');
const PortalEmailModel = require('../models/emailModel');
const RenderBodyHandler = require('../utils/renderBodyhandler');
const { STATUS_TYPE } = require('../utils/statusCodes');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      //sendmail: true,
      //newline: 'unix',
      //path: '/usr/sbin/sendmail'
      host: config.mail.host, // SMTP 服务器地址
      port: 465, // SMTP 服务端口，对于 SSL 通常是 465，对于 TLS 通常是 587
      secure: true, // 如果端口是 465，将这个值设为 true，表示使用 SSL
      auth: {
        user: config.mail.auth.user, // 你的邮箱地址
        pass: config.mail.auth.pass // 你的邮箱密码
      },
      authMethod: 'LOGIN', // 指定认证机制为LOGIN
      tls:{
        rejectUnauthorized: false
      }
    });
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
    let response = {};
    // 1. save information
    await this._beforeSendEmail(params);

    // 2. send email
    if (params.async) {
      response = RenderBodyHandler.renderBody({
        statusType: STATUS_TYPE.GLOBAL_SUCCESS,
        data: {
          result: null,
        }
      });
    } else {
      response = await this.send(params);
    }
    return response;
  }

  async _beforeSendEmail(params) {
    let sendMark = params.async ? 1 : 0;
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
    console.log(mailOptions);
    let result = null;
    let response;
    try {
      // this.transporter.sendMail return promise
      response = await this.transporter.sendMail(mailOptions);
      result = 0;

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
    } catch (error) {
      result = 1;
      response = error;
    }
    console.log(response);
    return;
  }

}

module.exports = new EmailService();


