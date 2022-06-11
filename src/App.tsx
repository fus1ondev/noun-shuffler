import React, { useState, useEffect } from 'react';
import { Heading, Textarea, Button, ButtonGroup, Box, Spinner, Checkbox, Text, Link } from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import styled from '@emotion/styled';
import * as kuromoji from 'kuromoji';
import dompurify from 'dompurify';

const sanitizer = dompurify.sanitize;

const AppContainer = styled.div`
  text-align: center;
`

function App() {
  let [enteredText, setEnteredText] = useState('');
  let [tokens, setTokens] = useState<kuromoji.IpadicFeatures[]>([]);
  let [generatedHtml, setGeneratedHtml] = useState('');
  let [generatedText, setGeneratedText] = useState('');
  let [isLoading, setIsLoading] = useState(false);

  let [ignoreHiragana, setIgnoreHiragana] = useState(true);

  const tokenize = (text: string) => {
    return new Promise<kuromoji.IpadicFeatures[]>(resolve => {
      let tokens = undefined;
      kuromoji.builder({ dicPath: '/dict' }).build((err, tokenizer) => {
        if (err) return;
        tokens = tokenizer.tokenize(text);
        resolve(tokens);
      });
    });
  }

  const generate = async () => {
    setIsLoading(true);
    const tokens = await tokenize(enteredText);
    setTokens(tokens);
    setIsLoading(false);
  }

  useEffect(() => {
    const isNoun = (token: kuromoji.IpadicFeatures) => token.pos === '名詞' && !(ignoreHiragana && token.surface_form.match(/^[ぁ-んー]*$/))

    const shuffledNouns = shuffle(tokens.filter(isNoun).map(token => token.surface_form))
    let nounIndex = 0
    const htmlElements = tokens.map(token => {
      if (isNoun(token)) {
        nounIndex++;
        return `<span><b>${shuffledNouns[nounIndex - 1]}</b></span>`;
      } else {
        return token.surface_form.replace(/\n/g,'<br>');
      }
    })
    setGeneratedHtml(sanitizer(htmlElements.join('')));

    nounIndex = 0
    const textElements = tokens.map(token => {
      if (isNoun(token)) {
        nounIndex++;
        return shuffledNouns[nounIndex - 1];
      } else {
        return token.surface_form.replace(/\n/g,'<br>');
      }
    })
    setGeneratedText(textElements.join(''));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tokens])

  const shuffle = (arr: Array<string>) => {
    var j, x, index;
    for (index = arr.length - 1; index > 0; index--) {
        j = Math.floor(Math.random() * (index + 1));
        x = arr[index];
        arr[index] = arr[j];
        arr[j] = x;
    }
    return arr;
  }
  
  return (
    <AppContainer>
      <Heading marginY={10}>名詞シャッフルジェネレーター</Heading>
      <Box><Textarea
        value={enteredText}
        onChange={e => {
          setEnteredText(e.target.value)
        }}
        placeholder='ここに入力'
        maxWidth='1000px'
      /></Box>
      <Box marginY={2}>
        <Checkbox
          isChecked={ignoreHiragana}
          onChange={e => {
            setIgnoreHiragana(!ignoreHiragana)
          }}
        >ひらがなをシャッフルしない</Checkbox>
      </Box>
      <Button
        isDisabled={enteredText === '' || isLoading}
        onClick={generate}
        marginY={4}
        colorScheme='blue'
      >
        {isLoading ? <Spinner size='sm'/> : undefined}
        シャッフル
      </Button>
      <Box
        borderRadius='lg'
        bg='blue.50'
        maxWidth='1000px'
        marginX='auto'
        padding={4}
      >
        <p dangerouslySetInnerHTML={{__html: generatedHtml}}/>
      </Box>
      <ButtonGroup gap={2} marginY={4}>
        <Button
          leftIcon={<CopyIcon />}
          isDisabled={generatedText === ''}
          onClick={e => {
            navigator.clipboard.writeText(generatedText);
          }}
        >コピー</Button>
        <Button
          isDisabled={generatedText === ''}
          onClick={e => {
            const shareURL = (text: string) => `https://twitter.com/share?text=${encodeURIComponent(text)}`;
            const shareText = 
`${generatedText}

#名詞シャッフルジェネレーター

https://noun-shuffler.vercel.app/`;
            window.open(shareURL(shareText), "_blank", "noreferrer");
          }}
        >ツイート</Button>
      </ButtonGroup>
      <Text fontSize='sm'>© 2022 Fus1onDev / <Link color='blue.500' href='https://github.com/Fus1onDev/noun-shuffler/'>GitHub</Link></Text>
    </AppContainer>
  );
}

export default App;
