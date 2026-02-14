jest.mock('../../../app/models/portalResourceModel');
jest.mock('../../../app/models/portalRoleModel');

const PortalResourceModel = require('../../../app/models/portalResourceModel');
const PortalRoleModel = require('../../../app/models/portalRoleModel');
const ResourceService = require('../../../app/services/resourceService');
const CustomError = require('../../../app/utils/customError');

describe('ResourceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllResources()', () => {
    it('should return all resources when no keyword', async () => {
      const mockResources = [
        { _id: 'res1', resource_name: 'Dashboard', resource_code: 'dash' },
        { _id: 'res2', resource_name: 'Settings', resource_code: 'set' },
      ];

      PortalResourceModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockResources),
        }),
      });

      const result = await ResourceService.getAllResources();

      expect(result.list).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(PortalResourceModel.find).toHaveBeenCalledWith({});
    });

    it('should filter resources by keyword', async () => {
      const mockResources = [{ _id: 'res1', resource_name: 'Dashboard' }];

      PortalResourceModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockResources),
        }),
      });

      const result = await ResourceService.getAllResources({ keyword: 'Dash' });

      expect(result.list).toHaveLength(1);
      expect(PortalResourceModel.find).toHaveBeenCalledWith({
        resource_name: { $regex: 'Dash', $options: 'i' },
      });
    });
  });

  describe('getResourceTree()', () => {
    it('should build hierarchical tree from flat list', async () => {
      const parentId = '507f1f77bcf86cd799439011';
      const childId = '507f1f77bcf86cd799439012';
      const mockResources = [
        {
          _id: { toString: () => parentId },
          resource_name: 'Root',
          resource_pid: null,
        },
        {
          _id: { toString: () => childId },
          resource_name: 'Child',
          resource_pid: { toString: () => parentId },
        },
      ];

      PortalResourceModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResources),
      });

      const result = await ResourceService.getResourceTree();

      expect(result.tree).toHaveLength(1);
      expect(result.tree[0].resource_name).toBe('Root');
      expect(result.tree[0].children).toHaveLength(1);
      expect(result.tree[0].children[0].resource_name).toBe('Child');
    });

    it('should handle orphaned children as roots', async () => {
      const mockResources = [
        {
          _id: { toString: () => 'child1' },
          resource_name: 'Orphan',
          resource_pid: { toString: () => 'nonexistent-parent' },
        },
      ];

      PortalResourceModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResources),
      });

      const result = await ResourceService.getResourceTree();

      expect(result.tree).toHaveLength(1);
      expect(result.tree[0].resource_name).toBe('Orphan');
    });
  });

  describe('getResourceById()', () => {
    it('should return resource when found', async () => {
      const mockResource = { _id: 'res1', resource_name: 'Dashboard' };
      PortalResourceModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResource),
      });

      const result = await ResourceService.getResourceById('res1');

      expect(result).toEqual(mockResource);
    });

    it('should throw when resource not found', async () => {
      PortalResourceModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(ResourceService.getResourceById('nonexistent')).rejects.toThrow(CustomError);
    });
  });

  describe('createResource()', () => {
    it('should create and return resource id', async () => {
      const mockId = 'new-res-id';
      PortalResourceModel.mockImplementation(function MockResource(data) {
        this._id = mockId;
        this.resource_name = data.resource_name;
        this.save = jest.fn().mockResolvedValue(this);
      });

      const result = await ResourceService.createResource({
        resource_code: 'dash',
        resource_name: 'Dashboard',
        resource_type: 'menu',
      });

      expect(result).toEqual({ _id: mockId });
    });
  });

  describe('updateResource()', () => {
    it('should update fields and return resource id', async () => {
      const mockResource = {
        _id: 'res1',
        resource_code: 'old',
        resource_name: 'Old Name',
        resource_type: 'menu',
        resource_url: '/old',
        resource_pid: null,
        save: jest.fn().mockResolvedValue(true),
      };
      PortalResourceModel.findById.mockResolvedValue(mockResource);

      const result = await ResourceService.updateResource('res1', {
        resource_name: 'New Name',
        resource_url: '/new',
      });

      expect(result).toEqual({ _id: 'res1' });
      expect(mockResource.resource_name).toBe('New Name');
      expect(mockResource.resource_url).toBe('/new');
      expect(mockResource.save).toHaveBeenCalled();
    });

    it('should throw when resource not found', async () => {
      PortalResourceModel.findById.mockResolvedValue(null);

      await expect(ResourceService.updateResource('nonexistent', {})).rejects.toThrow(CustomError);
    });
  });

  describe('deleteResource()', () => {
    it('should delete resource when not in use', async () => {
      const mockResource = { _id: 'res1', resource_name: 'Dashboard' };
      PortalResourceModel.findById.mockResolvedValue(mockResource);
      PortalRoleModel.countDocuments.mockResolvedValue(0);
      PortalResourceModel.findByIdAndDelete.mockResolvedValue(true);

      const result = await ResourceService.deleteResource('res1');

      expect(result).toEqual({ _id: 'res1' });
      expect(PortalResourceModel.findByIdAndDelete).toHaveBeenCalledWith('res1');
    });

    it('should throw when resource not found', async () => {
      PortalResourceModel.findById.mockResolvedValue(null);

      await expect(ResourceService.deleteResource('nonexistent')).rejects.toThrow(CustomError);
    });

    it('should throw when resource is assigned to roles', async () => {
      const mockResource = { _id: 'res1', resource_name: 'Dashboard' };
      PortalResourceModel.findById.mockResolvedValue(mockResource);
      PortalRoleModel.countDocuments.mockResolvedValue(2);

      await expect(ResourceService.deleteResource('res1')).rejects.toThrow(CustomError);
      expect(PortalResourceModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });

  describe('_buildTree()', () => {
    it('should correctly nest children under parents', () => {
      const resources = [
        {
          _id: { toString: () => 'p1' },
          resource_name: 'Parent 1',
          resource_pid: null,
        },
        {
          _id: { toString: () => 'p2' },
          resource_name: 'Parent 2',
          resource_pid: null,
        },
        {
          _id: { toString: () => 'c1' },
          resource_name: 'Child 1',
          resource_pid: { toString: () => 'p1' },
        },
        {
          _id: { toString: () => 'c2' },
          resource_name: 'Child 2',
          resource_pid: { toString: () => 'p1' },
        },
        {
          _id: { toString: () => 'c3' },
          resource_name: 'Child 3',
          resource_pid: { toString: () => 'p2' },
        },
      ];

      const tree = ResourceService._buildTree(resources);

      expect(tree).toHaveLength(2);
      expect(tree[0].children).toHaveLength(2);
      expect(tree[1].children).toHaveLength(1);
      expect(tree[0].children[0].resource_name).toBe('Child 1');
      expect(tree[0].children[1].resource_name).toBe('Child 2');
      expect(tree[1].children[0].resource_name).toBe('Child 3');
    });

    it('should return empty array for empty input', () => {
      const tree = ResourceService._buildTree([]);
      expect(tree).toEqual([]);
    });
  });
});
