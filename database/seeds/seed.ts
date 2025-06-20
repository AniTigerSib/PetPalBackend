import { runSeeders } from 'typeorm-extension';
import AppDataSource from '../../src/datasource';
import RoleSeeder from './role.seed';

const runSeed = async () => {
  try {
    await AppDataSource.initialize();
    // await runSeeders(AppDataSource);
    const seeder = new RoleSeeder(AppDataSource);
    await seeder.run();

    await AppDataSource.destroy();
    console.log('Seeds executed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  }
};

runSeed();
