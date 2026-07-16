import styled from 'styled-components';
import { neumorphColors, neumorphBoxShadow } from './utils/styles';

export const Appbar = styled.header`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: ${neumorphColors.background};
  box-shadow: ${neumorphBoxShadow};
  position: sticky;
  top: 0;
  z-index: 100;
`;
