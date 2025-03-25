import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Role } from '../../src/users/entities/role.entity';
import { ROLES } from 'src/users/constants/roles.constant';

export default class RoleSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<any> {
    const roleRepository = dataSource.getRepository(Role);

    // Check if user role already exists
    const userRole = await roleRepository.findOne({
      where: { name: ROLES.USER }
    });
    const adminRole = await roleRepository.findOne({
      where: { name: ROLES.ADMIN }
    });

    // If not, create it
    if (!userRole) {
      const newUserRole = roleRepository.create({
        name: ROLES.USER,
        description: 'Default role for registered users'
      });
      await roleRepository.save(newUserRole);
    }
    if (!adminRole) {
      const newAdminRole = roleRepository.create({
        name: ROLES.ADMIN,
        description: 'Administrator role'
      });
      await roleRepository.save(newAdminRole);
    }
  }
} 