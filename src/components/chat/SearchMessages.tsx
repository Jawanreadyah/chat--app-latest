import React from 'react';
import { SearchMessages as SearchMessagesComponent } from './search/SearchMessages';

interface SearchMessagesProps {
  chatId: string;
  onMessageSelect: (messageId: string) => void;
}

export function SearchMessages({ chatId, onMessageSelect }: SearchMessagesProps) {
  return (
    <SearchMessagesComponent
      chatId={chatId}
      onMessageSelect={onMessageSelect}
    />
  );
}