// /app/manager/components/topic/QuestionsTab.tsx
import { useState, useEffect, useCallback } from "react";
import { useManagerTranslation } from "../../hooks/useManagerTranslation";
import useApiRequest from "../../hooks/useApiRequest";
import SearchBar from "../subject/SearchBar";
import { ConfirmationModal } from "../common";
import QuestionStatusFilter, { StatusFilter } from "./QuestionStatusFilter";
import GenerateQuestionsModal from "./GenerateQuestionsModal";
import { useTopic } from "../../contexts/TopicContext";

