import styled from 'styled-components';
import { neumorphColors, neumorphBoxShadow } from './utils/styles';

export const Panel = styled.div`
  padding: 24px;
  background: ${neumorphColors.background};
  border-radius: 16px;
  box-shadow: ${neumorphBoxShadow};
`;
