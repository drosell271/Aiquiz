// /app/manager/components/topic/QuestionnarieTab.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useManagerTranslation } from "../../hooks/useManagerTranslation";
import useApiRequest from "../../hooks/useApiRequest";
import SearchBar from "../subject/SearchBar";
import { ConfirmationModal } from "../common";

