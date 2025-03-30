import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SocialCardProps {
  name: string;
  username: string;
  avatar: string;
  bio: string;
  hashtag: string;
  emoji: string;
  following: number;
  followers: string;
}

export function SocialCard({
  name,
  username,
  avatar,
  bio,
  hashtag,
  emoji,
  following,
  followers
}: SocialCardProps) {
  const [isFollowed, setIsFollowed] = useState(false);

  return (
    <motion.div 
      className="bg-[#1a1b1e] border border-[#2a2b2e] rounded-xl shadow-lg overflow-hidden max-w-[340px]"
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.1)" }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex gap-3">
          <div className="relative">
            <img
              src={avatar}
              alt={name}
              className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1b1e]"></div>
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-white">{name}</h4>
            <h5 className="text-xs text-gray-400">{username}</h5>
          </div>
        </div>
        <button
          onClick={() => setIsFollowed(!isFollowed)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            isFollowed 
              ? "bg-transparent text-purple-400 border border-purple-400" 
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          {isFollowed ? "Unfollow" : "Follow"}
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-2">
        <p className="text-xs text-gray-300">{bio}</p>
        <div className="mt-2 text-xs text-purple-400">
          {hashtag}
          <span className="ml-2" role="img" aria-label="emoji">
            {emoji}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#2a2b2e] flex gap-4">
        <div className="flex gap-1 items-center">
          <p className="text-xs font-semibold text-white">{following}</p>
          <p className="text-xs text-gray-400">Following</p>
        </div>
        <div className="flex gap-1 items-center">
          <p className="text-xs font-semibold text-white">{followers}</p>
          <p className="text-xs text-gray-400">Followers</p>
        </div>
      </div>
    </motion.div>
  );
}