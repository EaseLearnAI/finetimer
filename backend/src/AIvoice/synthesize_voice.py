import sys
import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer
import os

voice_id = sys.argv[1]
text = sys.argv[2]
output_path = sys.argv[3]

api_key = os.environ.get('DASHSCOPE_API_KEY')
if not api_key:
    raise RuntimeError('请在环境变量中配置 DASHSCOPE_API_KEY')
dashscope.api_key = api_key

synthesizer = SpeechSynthesizer(model='cosyvoice-v2', voice=voice_id)
audio = synthesizer.call(text)

with open(output_path, 'wb') as f:
    f.write(audio)

print(output_path) 