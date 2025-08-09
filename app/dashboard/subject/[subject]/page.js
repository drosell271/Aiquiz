"use client";
import { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { subjectNames } from "../../constants/language";
import { useTranslation } from "react-i18next";
import parse from "html-react-parser";
import Footer from "../../components/ui/Footer"

