import React from 'react';
import { Card, Typography } from 'antd';

const { Text, Title } = Typography;

const triviaData = [
  // Corporate Law Facts
  { title: "Corporate Trivia", fact: "The first modern corporation, the Dutch East India Company, was established in 1602 and was the first to issue stocks." },
  { title: "Did You Know?", fact: "Delaware, with less than 1% of the US population, is home to 68% of Fortune 500 companies due to its corporate-friendly laws." },
  { title: "Corporate History", fact: "The concept of 'limited liability' was first introduced in Sweden in 1655, revolutionizing business law." },
  { title: "Corporate Milestone", fact: "The world's largest corporate merger was between Vodafone and Mannesmann in 2000, valued at $180 billion." },
  { title: "Business Law", fact: "The term 'corporation sole' originated in the 15th century to protect church property under English law." },

  // Funny Law Facts
  { title: "Quirky Law", fact: "In Vermont, it's illegal to whistle underwater. Yes, someone actually made this a law!" },
  { title: "Legal Humor", fact: "The shortest will ever probated simply read 'All to wife.' It was accepted by the court in 1967." },
  { title: "Strange Law", fact: "In Arizona, it's illegal for donkeys to sleep in bathtubs due to a 1924 incident involving a merchant's donkey." },
  { title: "Funny Statute", fact: "In Rhode Island, it's illegal to challenge someone to a duel or accept a dueling challenge. Probably for the best!" },
  { title: "Legal Oddity", fact: "In Seattle, it's illegal to carry a concealed weapon over 6 feet in length. The shorter ones are fine, apparently." },

  // Additional Law Facts
  { title: "Historical Law", fact: "The Code of Hammurabi, from around 1750 BC, is one of the earliest known written legal codes." },
  { title: "Legal Custom", fact: "The tradition of judges wearing black robes comes from the mourning clothes worn after Queen Mary II's death in 1694." },
  { title: "Strange Law", fact: "In Britain, it's illegal to handle salmon in suspicious circumstances, according to the Salmon Act of 1986." },
  { title: "Legal Curiosity", fact: "In Switzerland, it's illegal to own just one guinea pig because they are prone to loneliness." },
  { title: "Modern Law", fact: "The longest court case in history lasted 681 years, between the Spanish Church and a local council over property rights." },
  { title: "Legal Tradition", fact: "The practice of saying 'God save the King/Queen' in courts originated in medieval England to show the source of judicial power." },
  { title: "Unusual Law", fact: "In France, it's illegal to name a pig 'Napoleon' due to a law protecting the dignity of the former emperor." },
  { title: "Court Custom", fact: "The US Supreme Court maintains a strict 'no cameras' policy in the courtroom, allowing only pencil sketches." },
];

const TriviaCard = React.memo(() => {
  const randomTrivia = triviaData[Math.floor(Math.random() * triviaData.length)];

  return (
    <Card 
      className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
      style={{ 
        width: '100%',
        maxWidth: '800px',
        height: '400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
      bodyStyle={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem',
        position: 'relative',
        zIndex: 1
      }}
    >
      <div className="flex flex-col items-center justify-center space-y-8 w-full">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
        <Title 
          level={3} 
          className="text-blue-700 text-center m-0 font-bold tracking-wide"
          style={{ 
            fontSize: '2rem',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {randomTrivia.title}
        </Title>
        <Text 
          className="text-gray-700 text-center max-w-2xl leading-relaxed"
          style={{ 
            fontSize: '1.25rem',
            lineHeight: '1.8',
            fontWeight: '400',
            letterSpacing: '0.2px'
          }}
        >
          {randomTrivia.fact}
        </Text>
        <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-400" />
      </div>
    </Card>
  );
}, () => true);

export default TriviaCard; 