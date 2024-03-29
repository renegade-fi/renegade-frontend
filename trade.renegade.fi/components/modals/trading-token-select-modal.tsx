import {
  Box,
  Grid,
  GridItem,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Token } from "@renegade-fi/renegade-js"
import Image from "next/image"
import { useMemo, useState } from "react"
import SimpleBar from "simplebar-react"
import "simplebar-react/dist/simplebar.min.css"

import { useApp } from "@/contexts/App/app-context"
import { useBalance } from "@/hooks/use-balance"
import { useDebounce } from "@/hooks/use-debounce"
import { DISPLAYED_TICKERS, TICKER_TO_NAME } from "@/lib/tokens"
import { formatAmount } from "@/lib/utils"

const ROW_HEIGHT = "56px"
interface TokenSelectModalProps {
  isOpen: boolean
  onClose: () => void
  setToken: (ticker: string) => void
}
export function TokenSelectModal({
  isOpen,
  onClose,
  setToken,
}: TokenSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const balances = useBalance()
  const filteredTickers = useMemo(() => {
    return DISPLAYED_TICKERS.filter(([ticker]) =>
      ticker.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )
  }, [debouncedSearchTerm])
  const filteredTickersWithBalances = useMemo(() => {
    const result: { ticker: string; balance: bigint | undefined }[] = []
    for (const [ticker] of filteredTickers) {
      const balance = Object.values(balances).find(
        ({ mint: { address } }) =>
          `0x${address}` === Token.findAddressByTicker(ticker)
      )
      result.push({ ticker, balance: balance?.amount })
    }
    return result
  }, [balances, filteredTickers])
  return (
    <Modal isCentered isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
      <ModalOverlay
        background="rgba(0, 0, 0, 0.25)"
        backdropFilter="blur(8px)"
      />
      <ModalContent
        height="592px"
        fontFamily="Favorit"
        fontSize="1.2em"
        background="white.5"
        border="var(--border)"
        borderColor="white.30"
      >
        <ModalHeader>
          Select a Token
          <Input
            marginTop={4}
            borderColor="whiteAlpha.300"
            _focus={{
              borderColor: "white.50 !important",
              boxShadow: "none !important",
            }}
            _placeholder={{ color: "whiteAlpha.400" }}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name or paste address"
            type="text"
            value={searchTerm}
          />
        </ModalHeader>
        <ModalBody padding="0">
          <ModalCloseButton />
          {filteredTickersWithBalances.length === 0 && (
            <Box display="grid" minHeight="80%" placeContent="center">
              <Text
                color="white.50"
                fontFamily="Favorit Extended"
                fontSize="1.2em"
              >
                No results found
              </Text>
            </Box>
          )}
          <SimpleBar
            style={{
              height: "100%",
            }}
          >
            {filteredTickersWithBalances
              .filter(({ ticker }) => ticker !== "USDC")
              .map(({ ticker, balance }) => {
                return (
                  <Row
                    key={ticker}
                    balance={balance}
                    ticker={ticker}
                    onRowClick={() => {
                      onClose()
                      setToken(ticker)
                    }}
                  />
                )
              })}
          </SimpleBar>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

interface RowProps {
  balance?: bigint
  ticker: string
  onRowClick: () => void
}

const Row = ({ ticker, onRowClick, balance }: RowProps) => {
  const { tokenIcons } = useApp()

  const balanceAmount = useMemo(() => {
    let result = balance ? formatAmount(balance, new Token({ ticker })) : "0"

    // Check if result has decimals and truncate to 2 decimals without rounding
    if (result.includes(".")) {
      const [integerPart, decimalPart] = result.split(".")
      result = `${integerPart}.${decimalPart.substring(0, 2)}`
    }

    return result
  }, [balance, ticker])
  return (
    <Grid
      className="wrapper"
      key={ticker}
      position="relative"
      alignItems="center"
      gridTemplateColumns="2fr 1fr"
      overflow="hidden"
      height={ROW_HEIGHT}
      _hover={{
        backgroundColor: "white.10",
      }}
      cursor="pointer"
      transition="0.1s"
      onClick={onRowClick}
      paddingX="5"
    >
      <GridItem>
        <HStack alignItems="center" gap="4">
          <Image
            alt={ticker}
            height={32}
            src={tokenIcons[ticker]}
            width={32}
            priority
          />
          <VStack alignItems="start" gap="0">
            <Text>{TICKER_TO_NAME[ticker]}</Text>
            <Text color="white.60" fontSize="0.7em">
              {ticker}
            </Text>
          </VStack>
        </HStack>
      </GridItem>
      <GridItem>
        <Box textAlign="right">
          <Text color="white.50" fontFamily="Favorit Mono">
            {balanceAmount}
          </Text>
        </Box>
      </GridItem>
    </Grid>
  )
}
