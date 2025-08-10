import { useEffect, useState } from "react";
import { HiCheck, HiOutlineXMark } from "react-icons/hi2";
import nextConfig from "../../next.config";
import urljoin from "url-join";
import { useTranslation } from "react-i18next";
import CheckOutlined from "@mui/icons-material/CheckOutlined";

const basePath = nextConfig.basePath || "";

