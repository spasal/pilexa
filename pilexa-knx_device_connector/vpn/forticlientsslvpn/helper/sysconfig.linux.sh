#! /bin/bash

export PATH=$PATH:/sbin:/usr/sbin:/bin:/usr/bin

base=`dirname "$0"`
echo "begin sysconfig linux" >> "$base/forticlientsslvpn.log"

echo -n "Generating pppd.resolv.conf..." >> "$base/forticlientsslvpn.log"

ifup=0
while [ "$ifup" == "0" ]; do
	sleep 1
	logstat=`awk '
	/^Connect:/	{
		dns1 = "";
		dns2 = "";
		up = 0;
		}
	/^local/	{
		up = 1;
		}
	/^primary/	{
		dns1 = $4;
		}
	/^secondary/	{
		dns2 = $4;
		}
	END		{
		print dns1 ":" dns2 ":" up
	}' "$base/pppd.log"`

	dns1=`echo $logstat|awk -F : ' {print $1 }'`
	dns2=`echo $logstat|awk -F : ' {print $2 }'`
	ifup=`echo $logstat|awk -F : ' {print $3 }'`
done

if [ "x$dns1" != "x" ]; then
	echo "nameserver	$dns1" > "$base/pppd.resolv.conf"
fi

if [ "x$dns1" == "x$dns2" ]; then
	dns2=""
fi

if [ "x$dns2" != "x" ]; then
	echo "nameserver	$dns2" >> "$base/pppd.resolv.conf"
fi

echo "Done" >> "$base/forticlientsslvpn.log"

if [ -f "$base/pppd.resolv.conf" ]; then
	cat "$base/pppd.resolv.conf" >> "$base/forticlientsslvpn.log"
	cat "$base/pppd.resolv.conf" "$base/resolv.conf.backup" > /etc/resolv.conf
	rm -f "$base/pppd.resolv.conf"
fi

source "$base/forticlientsslvpn.backup.tmp"
rm -f "$base/forticlientsslvpn.backup.tmp"

echo "server route $svrt" >> "$base/forticlientsslvpn.log"
ifn=`route -n|grep "^1.1.1.1"|awk '{print $8}'`
echo "interface $ifn" >> "$base/forticlientsslvpn.log"

addr=`ifconfig $ifn |grep "inet"|awk ' {print $2 }'| awk -F : '{ print $2}'`
echo "address $addr" >> "$base/forticlientsslvpn.log"

echo "delete route 1.1.1.1" >> "$base/forticlientsslvpn.log"
route -n del 1.1.1.1 >> "$base/forticlientsslvpn.log"

rm -f "$base/forticlientsslvpn.cleanup.tmp"
if [ $1 == 1.1.1.1 ]; then
	if [ "$specialgw" != "" ]; then
		echo "Add the route for 1.1.1.1($specialgw)" >> "$base/forticlientsslvpn.log"
		route -n add 1.1.1.1 gw $specialgw >> "$base/forticlientsslvpn.log"
		if [ $specialhasrd == 0 ]; then
			echo "route -n del 1.1.1.1" >> "$base/forticlientsslvpn.cleanup.tmp"
		fi
	fi
else
	if [ $svrhasrd == 1 ]; then
		echo "route to $1 already OK" >> "$base/forticlientsslvpn.log"
	else if [ "$svrgw" != "" ]; then
		echo "Add route for $1($svrgw)" >> "$base/forticlientsslvpn.log"
		route -n add $1 gw $svrgw >> "$base/forticlientsslvpn.log"
		echo "route -n del $1" >> "$base/forticlientsslvpn.cleanup.tmp"
		fi
	fi
fi

if [ "$2" == "0" ]; then
	echo "router $addr server route $svrt" >> "$base/forticlientsslvpn.log"
	echo "route -n add default gw $addr" >> "$base/forticlientsslvpn.log"
	route -n add default gw $addr >> "$base/forticlientsslvpn.log"
fi

tuns=`echo $2|sed s/,/\ /g`
if [ "$2" != "0" ]; then
	for tun in $tuns;
	do
		tund=`echo $tun|awk -F / ' {print $1}'`
		tunm=`echo $tun|awk -F / ' {print $2}'`
		if [ $tund != "0.0.0.0" ]; then
			echo "route -n add -net $tund netmask $tunm gw $addr" >> "$base/forticlientsslvpn.log"
			route -n add -net $tund netmask $tunm gw $addr >>"$base/forticlientsslvpn.log" 2>&1
		fi
	done
fi
