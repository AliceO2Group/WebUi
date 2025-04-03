import { UserRepository } from './UserRepository.js';
import { LayoutRepository } from './LayoutRepository.js';
import { TabRepository } from './TabRepository.js';
import { GridTabCellRepository } from './GridTabCellRepository.js';
import { ChartRepository } from './ChartRepository.js';
import { ChartOptionsRepository } from './ChartOptionsRepository.js';
import { OptionRepository } from './OptionRepository.js';

export const setupRepositories = (sequelizeDatabase) => {
  const { Layout, User, Tab, GridTabCell, Chart, ChartOption, Option } = sequelizeDatabase.models;

  // Repositories
  const userRepository = new UserRepository(User);
  const layoutRepository = new LayoutRepository(Layout);
  const tabRepository = new TabRepository(Tab, Layout);
  const gridTabCellRepository = new GridTabCellRepository(GridTabCell);
  const chartRepository = new ChartRepository(Chart, ChartOption, Option);
  const chartOptionRepository = new ChartOptionsRepository(ChartOption);
  const optionRepository = new OptionRepository(Option);

  return {
    userRepository,
    layoutRepository,
    tabRepository,
    gridTabCellRepository,
    chartRepository,
    chartOptionRepository,
    optionRepository,
  };
};
