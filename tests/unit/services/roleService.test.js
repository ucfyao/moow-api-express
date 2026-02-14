jest.mock('../../../app/models/portalRoleModel');
jest.mock('../../../app/models/portalUserModel');

const PortalRoleModel = require('../../../app/models/portalRoleModel');
const PortalUserModel = require('../../../app/models/portalUserModel');
const RoleService = require('../../../app/services/roleService');
const CustomError = require('../../../app/utils/customError');

describe('RoleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRoles()', () => {
    it('should return all roles when no keyword', async () => {
      const mockRoles = [
        { _id: 'r1', role_name: 'Admin', role_description: 'Administrator' },
        { _id: 'r2', role_name: 'User', role_description: 'Regular user' },
      ];

      PortalRoleModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockRoles),
          }),
        }),
      });

      const result = await RoleService.getAllRoles();

      expect(result.list).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(PortalRoleModel.find).toHaveBeenCalledWith({});
    });

    it('should filter roles by keyword', async () => {
      const mockRoles = [{ _id: 'r1', role_name: 'Admin' }];

      PortalRoleModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockRoles),
          }),
        }),
      });

      const result = await RoleService.getAllRoles({ keyword: 'Admin' });

      expect(result.list).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(PortalRoleModel.find).toHaveBeenCalledWith({
        role_name: { $regex: 'Admin', $options: 'i' },
      });
    });
  });

  describe('getRoleDroplist()', () => {
    it('should return formatted dropdown list', async () => {
      const mockRoles = [
        { _id: 'r1', role_name: 'Admin' },
        { _id: 'r2', role_name: 'User' },
      ];

      PortalRoleModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockRoles),
        }),
      });

      const result = await RoleService.getRoleDroplist();

      expect(result.list).toHaveLength(2);
      expect(result.list[0]).toEqual({ value: 'r1', label: 'Admin' });
      expect(result.list[1]).toEqual({ value: 'r2', label: 'User' });
    });
  });

  describe('getRoleById()', () => {
    it('should return role when found', async () => {
      const mockRole = { _id: 'r1', role_name: 'Admin' };
      PortalRoleModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRole),
      });

      const result = await RoleService.getRoleById('r1');

      expect(result).toEqual(mockRole);
    });

    it('should throw when role not found', async () => {
      PortalRoleModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(RoleService.getRoleById('nonexistent')).rejects.toThrow(CustomError);
    });
  });

  describe('createRole()', () => {
    it('should create and return role id', async () => {
      const mockId = 'new-role-id';
      PortalRoleModel.mockImplementation(function MockRole(data) {
        this._id = mockId;
        this.role_name = data.role_name;
        this.save = jest.fn().mockResolvedValue(this);
      });

      const result = await RoleService.createRole({ role_name: 'Editor' });

      expect(result).toEqual({ _id: mockId });
    });
  });

  describe('updateRole()', () => {
    it('should update fields and return role id', async () => {
      const mockRole = {
        _id: 'r1',
        role_name: 'Admin',
        role_description: 'Old',
        resource: [],
        save: jest.fn().mockResolvedValue(true),
      };
      PortalRoleModel.findById.mockResolvedValue(mockRole);

      const result = await RoleService.updateRole('r1', {
        role_name: 'Super Admin',
        role_description: 'New description',
        resource: ['res1'],
      });

      expect(result).toEqual({ _id: 'r1' });
      expect(mockRole.role_name).toBe('Super Admin');
      expect(mockRole.role_description).toBe('New description');
      expect(mockRole.resource).toEqual(['res1']);
      expect(mockRole.save).toHaveBeenCalled();
    });

    it('should throw when role not found', async () => {
      PortalRoleModel.findById.mockResolvedValue(null);

      await expect(RoleService.updateRole('nonexistent', {})).rejects.toThrow(CustomError);
    });
  });

  describe('deleteRole()', () => {
    it('should delete role when not in use', async () => {
      const mockRole = { _id: 'r1', role_name: 'Admin' };
      PortalRoleModel.findById.mockResolvedValue(mockRole);
      PortalUserModel.countDocuments.mockResolvedValue(0);
      PortalRoleModel.findByIdAndDelete.mockResolvedValue(true);

      const result = await RoleService.deleteRole('r1');

      expect(result).toEqual({ _id: 'r1' });
      expect(PortalRoleModel.findByIdAndDelete).toHaveBeenCalledWith('r1');
    });

    it('should throw when role not found', async () => {
      PortalRoleModel.findById.mockResolvedValue(null);

      await expect(RoleService.deleteRole('nonexistent')).rejects.toThrow(CustomError);
    });

    it('should throw when role is assigned to users', async () => {
      const mockRole = { _id: 'r1', role_name: 'Admin' };
      PortalRoleModel.findById.mockResolvedValue(mockRole);
      PortalUserModel.countDocuments.mockResolvedValue(3);

      await expect(RoleService.deleteRole('r1')).rejects.toThrow(CustomError);
      expect(PortalRoleModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });
});
