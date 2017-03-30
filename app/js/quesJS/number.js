// ����ת���� ֧�ֵ�12λ  
var Utils={  
    /* 
        ��λ 
    */  
    units:'��ʮ��ǧ��@#%��^&~',  
    /* 
        �ַ� 
    */  
    chars:'��һ�����������߰˾�',  
    /* 
        ����ת���� 
        @number {Integer} ����123������ 
        @return {String} ����ת���ɵ����� һ�ٶ�ʮ�� ���ַ���              
    */  
    numberToChinese:function(number){  
        var a=(number+'').split(''),s=[],t=this;  
        if(a.length>12){  
            throw new Error('too big');  
        }else{  
            for(var i=0,j=a.length-1;i<=j;i++){  
                if(j==1||j==5||j==9){//��λ�� ��������� 1*  
                    if(i==0){  
                        if(a[i]!='1')s.push(t.chars.charAt(a[i]));  
                    }else{  
                        s.push(t.chars.charAt(a[i]));  
                    }  
                }else{  
                    s.push(t.chars.charAt(a[i]));  
                }  
                if(i!=j){  
                    s.push(t.units.charAt(j-i));  
                }  
            }  
        }  
        //return s;  
        return s.join('').replace(/��([ʮ��ǧ����@#%^&~])/g,function(m,d,b){//���ȴ��� ��� ��ǧ ��  
            b=t.units.indexOf(d);  
            if(b!=-1){  
                if(d=='��')return d;  
                if(d=='��')return d;  
                if(a[j-b]=='0')return '��'  
            }  
            return '';  
        }).replace(/��+/g,'��').replace(/��([����])/g,function(m,b){// ��� ��ǧ����� ���ܳ��� ���������� �ٴ����βΪ���  
            return b;  
        }).replace(/��[��ǧ��]/g,'��').replace(/[��]$/,'').replace(/[@#%^&~]/g,function(m){  
            return {'@':'ʮ','#':'��','%':'ǧ','^':'ʮ','&':'��','~':'ǧ'}[m];  
        }).replace(/([����])([һ-��])/g,function(m,d,b,c){  
            c=t.units.indexOf(d);  
            if(c!=-1){  
                if(a[j-c]=='0')return d+'��'+b  
            }  
            return m;  
        });  
    }  
};