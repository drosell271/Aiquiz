"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useManagerTranslation } from "../../../../../../hooks/useManagerTranslation";
import {
	SubtopicProvider,
	useSubtopic,
	Subtopic,
} from "../../../../../../contexts/SubtopicContext";
import useApiRequest from "../../../../../../hooks/useApiRequest";
import apiService from "../../../../../../services";

