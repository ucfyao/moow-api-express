jest.mock('nodemailer');
jest.mock('../../../app/models/portalEmailInfoModel');
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const nodemailer = require('nodemailer');
const PortalEmailInfoModel = require('../../../app/models/portalEmailInfoModel');

// Set model statics before requiring the service
PortalEmailInfoModel.STATUS_FAILED = 0;
PortalEmailInfoModel.STATUS_SUCCESS = 1;
PortalEmailInfoModel.SEND_MARK_ALREADY_SENT = 0;
PortalEmailInfoModel.SEND_MARK_WAIT_TO_SEND = 1;

// Setup nodemailer mock transport before requiring the service
const mockSendMail = jest.fn();
nodemailer.createTransport.mockReturnValue({
  sendMail: mockSendMail,
});

const EmailService = require('../../../app/services/emailService');

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup sendMail mock since clearAllMocks resets it
    mockSendMail.mockReset();
  });

  describe('sendEmail()', () => {
    it('should save email info and send synchronously when async is false', async () => {
      const mockEmailDoc = {
        _id: 'email-doc-1',
        save: jest.fn().mockResolvedValue({ _id: 'email-doc-1' }),
      };
      PortalEmailInfoModel.mockImplementation(() => mockEmailDoc);

      mockSendMail.mockResolvedValue({
        accepted: ['test@example.com'],
        rejected: [],
        envelope: { from: 'no-reply@moow.cc', to: ['test@example.com'] },
        response: '250 OK',
        messageId: 'msg-1',
      });
      PortalEmailInfoModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });

      const params = {
        async: false,
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Hello',
        html: '<p>Hello</p>',
      };

      const result = await EmailService.sendEmail(params);

      expect(mockEmailDoc.save).toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalled();
      expect(result.emailStatus).toBe(PortalEmailInfoModel.STATUS_SUCCESS);
      expect(result.async).toBe(false);
    });

    it('should save email info but not send when async is true', async () => {
      const mockEmailDoc = {
        _id: 'email-doc-2',
        save: jest.fn().mockResolvedValue({ _id: 'email-doc-2' }),
      };
      PortalEmailInfoModel.mockImplementation(() => mockEmailDoc);

      const params = {
        async: true,
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Hello',
        html: '<p>Hello</p>',
      };

      const result = await EmailService.sendEmail(params);

      expect(mockEmailDoc.save).toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
      expect(result.emailStatus).toBe(PortalEmailInfoModel.STATUS_FAILED);
      expect(result.async).toBe(true);
    });
  });

  describe('sendAlarmMail()', () => {
    it('should send alarm email with correct params', async () => {
      const mockEmailDoc = {
        _id: 'email-doc-3',
        save: jest.fn().mockResolvedValue({ _id: 'email-doc-3' }),
      };
      PortalEmailInfoModel.mockImplementation(() => mockEmailDoc);

      mockSendMail.mockResolvedValue({
        accepted: ['alarm@moow.cc'],
        rejected: [],
        envelope: {},
        response: '250 OK',
        messageId: 'msg-alarm',
      });
      PortalEmailInfoModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });

      // Need to set config.alarm.mailto
      const config = require('../../../config');
      config.alarm = { mailto: ['alarm@moow.cc'] };

      jest.spyOn(EmailService, 'sendEmail');

      await EmailService.sendAlarmMail('Alert Subject', 'Something went wrong');

      expect(EmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          async: false,
          to: ['alarm@moow.cc'],
          subject: 'Alert Subject',
          text: 'Something went wrong',
          html: '<p>Something went wrong</p>',
        })
      );
    });

    it('should return early when mailto is empty', async () => {
      const config = require('../../../config');
      config.alarm = { mailto: [] };

      jest.spyOn(EmailService, 'sendEmail');

      await EmailService.sendAlarmMail('Alert', 'message');

      expect(EmailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('send()', () => {
    it('should handle transporter errors gracefully', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

      const params = {
        to: 'test@example.com',
        subject: 'Test',
        text: 'Hello',
        html: '<p>Hello</p>',
      };

      const result = await EmailService.send(params);

      expect(result.emailStatus).toBe(PortalEmailInfoModel.STATUS_FAILED);
      expect(result.desc).toBeInstanceOf(Error);
    });

    it('should send email with attachments', async () => {
      mockSendMail.mockResolvedValue({
        accepted: ['test@example.com'],
        rejected: [],
        envelope: {},
        response: '250 OK',
        messageId: 'msg-2',
      });

      const params = {
        _emailId: 'email-doc-4',
        to: 'test@example.com',
        subject: 'With Attachment',
        text: 'See attached',
        html: '<p>See attached</p>',
        attachments: [{ filename: 'report.pdf', content: 'base64content' }],
      };

      PortalEmailInfoModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });

      const result = await EmailService.send(params);

      expect(result.emailStatus).toBe(PortalEmailInfoModel.STATUS_SUCCESS);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [{ filename: 'report.pdf', content: 'base64content', encoding: 'base64' }],
        })
      );
    });
  });
});
