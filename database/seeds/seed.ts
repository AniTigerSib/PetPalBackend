import { runSeeders } from 'typeorm-extension';
import AppDataSource from '../../src/datasource';

const runSeed = async () => {
  try {
    await AppDataSource.initialize();
    await runSeeders(AppDataSource);
    console.log('Seeds executed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  }
};

runSeed(); 