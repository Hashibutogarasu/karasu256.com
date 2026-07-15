import styled from 'styled-components';
import { neumorphColors, neumorphBoxShadow } from './utils/styles';

export const Footer = styled.footer`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  background: ${neumorphColors.background};
  box-shadow: ${neumorphBoxShadow};
  margin-top: auto;
`;
