const mongoose = require('mongoose');

const PortalEmailInfoSchema = new mongoose.Schema(
  {
    send_mark: { type: Number }, // send mark: 0-already sent, 1-wait to send
    email_detail: {
      async: { type: Boolean }, // whether async
      to: { type: [String] }, // receiver
      cc: { type: [String] }, // make a copy for someone
      bcc: { type: [String] }, // make a copy for someone secretly
      subject: { type: String }, // subject
      text: { type: String }, // content of text
      html: { type: String }, // content of html
      attachments: [
        {
          filename: { type: String },
          content: { type: String },
          encoding: { type: String },
        },
      ],
    }, // task detail
    email_status: {
      accepted: { type: [String] },
      rejected: { type: [String] },
      response: { type: String },
      envelope: {
        from: { type: String },
        to: { type: [String] },
      },
      message_id: { type: String },
    }, // task status
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }, // auto create created_at and updated_at
    collection: 'portal_email_infos',
  },
);

// Email send mark
PortalEmailInfoSchema.statics.SEND_MARK_ALREADY_SENT = 0;
PortalEmailInfoSchema.statics.SEND_MARK_WAIT_TO_SEND = 1;
// Email status
PortalEmailInfoSchema.statics.STATUS_FAILED = 0;
PortalEmailInfoSchema.statics.STATUS_SUCCESS = 1;

const PortalEmailInfoModel = mongoose.model('portal_email_info', PortalEmailInfoSchema);
module.exports = PortalEmailInfoModel;
