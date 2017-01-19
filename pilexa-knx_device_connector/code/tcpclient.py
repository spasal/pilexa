import socket
import sys
import time

def send_message(message):
    # Create a TCP/IP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)

    # Connect to remote host
    try:
        host = '172.23.49.0'
        port = 12345
        sock.connect((host, port))
    except:
        print('unable to connect to remote host')
        sys.exit()

    print('connected to remote host')

    #try:
    # send message
    print('sending %s' % message)
    message = message + " \n \r"
    sock.sendall(message)
    print("message sent")
    time.sleep(1)
        
        # return answer
    answer = ""
    while True:
        data = sock.recv(4096)
        if '/end/' in data:
            answer += data
            print('answer: "%s"' % answer)
            break
        else:
            answer += data
                

    #finally:
    print('closing connection')
    sock.close()
    return answer

