from email import contentmanager
import socket

def extract_ip():
    st = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:       
        st.connect(('10.255.255.255', 1))
        IP = st.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        st.close()
    return IP

JS_FILE=['./static/js/dashboard.js', './static/js/stream.js']

cnts, lines, texts = [], [], []
for file in JS_FILE:
    
    # Open and searching
    with open(file, 'r') as f:
        src = f.readlines()
    for line, content in enumerate(src):
        
        if 'const DOMAIN' in content:
            print('-'*50, '\n')
            print('Searching DOMAIN in {} ... '.format(file))
            print('Found DOMAIN in line {}: {}'.format(line, content.rstrip()))
            
            trg_cnt = "{} = '{}';\n".format(content.split(' = ')[0], extract_ip() )
            src[line] = trg_cnt
            print('Modify the DOMAIN: {}'.format(extract_ip()))
            continue

    # Wrtie file
    with open('{}'.format(file), 'w') as my_file:
        new_file_contents = "".join(src)
        my_file.write(new_file_contents)
        my_file.close()
