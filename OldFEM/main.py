import server

# server
import socket
import threading
import json
from ocr_detect import OCRDetect
import os
import logging

# ocr
import numpy as np
from paddleocr import PaddleOCR, draw_ocr
import pyautogui

import cv2
import time, os


if __name__ == '__main__':
    server.run()