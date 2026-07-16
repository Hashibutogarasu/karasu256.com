import styled from 'styled-components';
import { neumorphColors, neumorphBoxShadow, neumorphInsetBoxShadow } from './utils/styles';

export const Link = styled.a`
  display: inline-block;
  padding: 8px 16px;
  text-decoration: none;
  color: #666;
  background: ${neumorphColors.background};
  border-radius: 8px;
  box-shadow: ${neumorphBoxShadow};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: ${neumorphInsetBoxShadow};
  }
`;
