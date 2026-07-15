import styled from 'styled-components';
import { neumorphColors, neumorphBoxShadow, neumorphInsetBoxShadow } from './utils/styles';

export const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  background: ${neumorphColors.background};
  color: #666;
  font-weight: 600;
  cursor: pointer;
  box-shadow: ${neumorphBoxShadow};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: ${neumorphInsetBoxShadow};
  }
`;
