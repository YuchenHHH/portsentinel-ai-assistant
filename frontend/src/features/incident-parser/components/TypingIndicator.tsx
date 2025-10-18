import React from 'react'
import { HStack, Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

/**
 * 打字指示器组件 - 模拟"正在输入"的动画效果
 */
export const TypingIndicator: React.FC = () => {
  return (
    <HStack spacing={1} align="center">
      {[0, 1, 2].map((index) => (
        <MotionBox
          key={index}
          w="8px"
          h="8px"
          bg="gray.400"
          borderRadius="full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.2, // 交错动画效果
            ease: "easeInOut",
          }}
        />
      ))}
    </HStack>
  )
}
