const mongoose = require("mongoose");

const PortalEmailSchema = new mongoose.Schema(
  {
    send_mark: {type: Number}, // send mark: 0-already sent, 1-wait to send
    email_detail: {
      async: {type: Boolean},   // whether async
      to: {type: [String]},   // receiver
      cc: {type: [String]},  // make a copy for someone
      bcc: {type: [String]},  // make a copy for someone secretly
      subject: {type: String},  // subject
      text: {type: String},  // content of text
      html: {type: String},  // content of html
      attachments: [
        {
          filename: {type: String},
          content: {type: String},
          encoding: {type: String}
        },
      ]
    }, // task detail
    email_status: {
      accepted: {type: [String]},
      rejected: {type: [String]},
      response: {type: String},
      envelope: {
        from: {type: String},
        to: {type: [String]}
      },
      message_id: {type: String}
    }, // task status
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },  // auto create created_at and updated_at
    collection: 'portal_email_info'
  }
);

const PortalEmailModel = mongoose.model("PortalEmailModel", PortalEmailSchema);
module.exports = PortalEmailModel;
