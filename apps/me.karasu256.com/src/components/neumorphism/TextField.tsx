import styled from 'styled-components';
import { neumorphColors, neumorphInsetBoxShadow } from './utils/styles';

export const TextField = styled.input`
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  background: ${neumorphColors.background};
  color: #666;
  box-shadow: ${neumorphInsetBoxShadow};
  outline: none;

  &::placeholder {
    color: #999;
  }
`;
