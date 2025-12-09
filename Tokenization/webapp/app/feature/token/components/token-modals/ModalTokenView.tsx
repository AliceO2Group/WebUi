import React from 'react';
import { TokenModalBan, TokenModalBanBulk } from './TokenModalBan';
import { TokenModalUnban, TokenModalUnbanBulk } from './TokenModalUnban';

type Variant = 'ban' | 'unban' | null | undefined;

type Props = {
  variant: Variant;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tokenId: string | null;
  onBanConfirm: (id: string) => void;
  onUnbanConfirm: (id: string) => void;
};
    
export default function ModalTokenView({ variant, open, setOpen, tokenId, onBanConfirm, onUnbanConfirm }: Props) {
  if (!variant) return null;

  if (tokenId === 'bulk') {
    const onConfirm = () => onBanConfirm('bulk');
    if (variant === 'ban') {
      return <TokenModalBanBulk open={open} setOpen={setOpen} onConfirm={() => onBanConfirm('bulk')} />;
    }
    return <TokenModalUnbanBulk open={open} setOpen={setOpen} onConfirm={() => onUnbanConfirm('bulk')} />;
  }

  if (!tokenId) return null;

  if (variant === 'ban') {
    return <TokenModalBan open={open} setOpen={setOpen} tokenId={tokenId} onConfirm={() => onBanConfirm(tokenId)} />;
  }

  return <TokenModalUnban open={open} setOpen={setOpen} tokenId={tokenId} onConfirm={() => onUnbanConfirm(tokenId)} />;
};

