"use client"

import WithdrawButton from "@/app/(desktop)/withdraw-button"
import { ViewEnum, useApp } from "@/contexts/App/app-context"
import { ChevronDownIcon, ChevronLeftIcon } from "@chakra-ui/icons"
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { useState } from "react"
import { useLocalStorage } from "usehooks-ts"

import { useMax } from "@/hooks/use-max"

import { TradingTokenSelectModal } from "@/components/modals/renegade-token-select-modal"

export function WithdrawBody() {
  const { setView } = useApp()
  const {
    isOpen: tokenMenuIsOpen,
    onOpen: onOpenTokenMenu,
    onClose: onCloseTokenMenu,
  } = useDisclosure()
  const [base] = useLocalStorage("base", "WETH", {
    initializeWithValue: false,
  })
  const [baseTokenAmount, setBaseTokenAmount] = useState("")

  const handleSetBaseTokenAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (
      value === "" ||
      (!isNaN(parseFloat(value)) &&
        isFinite(parseFloat(value)) &&
        parseFloat(value) >= 0)
    ) {
      setBaseTokenAmount(value)
    }
  }

  const max = useMax(base)

  const handleSetMax = () => {
    if (max) {
      setBaseTokenAmount(max)
    }
  }

  const hideMaxButton = !max || baseTokenAmount === max

  return (
    <>
      <Flex
        position="relative"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        flexGrow="1"
      >
        <Box
          transform={baseTokenAmount ? "translateY(-15px)" : "translateY(10px)"}
          transition="0.15s"
        >
          <HStack fontFamily="Aime" fontSize="1.8em" spacing="20px">
            <div>
              <Button
                position="absolute"
                top="-24px"
                color="text.secondary"
                fontWeight="600"
                onClick={() => setView(ViewEnum.TRADING)}
                variant="link"
              >
                <ChevronLeftIcon />
                Back to Trading
              </Button>
              <Text color="text.secondary" fontSize="34px">
                Withdraw
              </Text>
            </div>
            <InputGroup>
              <Input
                width="200px"
                paddingRight={hideMaxButton ? undefined : "3rem"}
                fontFamily="Favorit"
                fontSize="0.8em"
                borderColor="whiteAlpha.300"
                borderRadius="100px"
                _focus={{
                  borderColor: "white.50 !important",
                  boxShadow: "none !important",
                }}
                _placeholder={{ color: "whiteAlpha.400" }}
                outline="none !important"
                onChange={handleSetBaseTokenAmount}
                onFocus={(e) =>
                  e.target.addEventListener(
                    "wheel",
                    (e) => e.preventDefault(),
                    {
                      passive: false,
                    }
                  )
                }
                placeholder="0.00"
                type="number"
                value={baseTokenAmount}
              />
              {!hideMaxButton && (
                <InputRightElement width="3.5rem">
                  <Button
                    color="text.secondary"
                    fontFamily="Favorit"
                    fontWeight="400"
                    borderRadius="100px"
                    onClick={handleSetMax}
                    size="xs"
                    variant="ghost"
                  >
                    Max
                  </Button>
                </InputRightElement>
              )}
            </InputGroup>
            <HStack
              userSelect="none"
              cursor="pointer"
              onClick={onOpenTokenMenu}
            >
              <Text variant="trading-body-button">{base}</Text>
              <ChevronDownIcon boxSize="20px" viewBox="6 6 12 12" />
            </HStack>
          </HStack>
        </Box>
        <WithdrawButton
          baseTicker={base}
          baseTokenAmount={baseTokenAmount}
          setBaseTokenAmount={setBaseTokenAmount}
        />
      </Flex>
      <TradingTokenSelectModal
        isOpen={tokenMenuIsOpen}
        onClose={onCloseTokenMenu}
      />
    </>
  )
}
