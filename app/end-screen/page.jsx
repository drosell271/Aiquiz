'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { pickRandom } from '../utils'
import { endMessages } from '../constants/endMessages'

import useWindowSize from 'react-use/lib/useWindowSize'
import Confetti from 'react-confetti'

import Link from "next/link"
import { gifs } from '../constants/gifs'
import { Suspense } from 'react'
import { useTranslation } from "react-i18next";
import Header from "../components/ui/Header"

