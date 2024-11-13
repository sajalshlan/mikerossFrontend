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

  // Cornelia Sorabji Facts
  { title: "Pioneer", fact: "Cornelia Sorabji was India's first female lawyer and the first woman to graduate from Bombay University." },
  { title: "Breaking Barriers", fact: "In 1892, Sorabji became the first woman to study law at Oxford University, though she couldn't formally graduate until 1922." },
  { title: "Legal Champion", fact: "Sorabji fought for the rights of purdahnashins - women forbidden by custom from communicating with the outside male world." },
  { title: "Did You Know?", fact: "Cornelia Sorabji wrote several books including 'India Calling' and 'India Recalled', documenting her unique experiences." },
  { title: "Social Reform", fact: "Despite facing discrimination, Sorabji helped over 600 women and orphans fight legal battles free of charge between 1904 and 1923." },
  { title: "Historical Note", fact: "Sorabji was the first woman to practice law in both India and Britain, opening doors for future generations." },
  { title: "Legal Legacy", fact: "The Cornelia Sorabji Scholarship at Oxford University continues to support Indian women studying law." },
  { title: "Family History", fact: "Cornelia's father, Reverend Sorabji Karsedji, was a key figure in convincing Bombay University to admit women." },
  { title: "Inspiration", fact: "Florence Nightingale helped fund Cornelia Sorabji's education at Oxford after learning about her aspirations." },
  { title: "Achievement", fact: "In 1904, Sorabji became the first woman to be appointed as a legal advisor to the Court of Wards in Bengal." }
];

const TriviaCard = () => {
  const randomTrivia = triviaData[Math.floor(Math.random() * triviaData.length)];

  return (
    <Card 
      className="bg-blue-50 border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-300"
      style={{ 
        width: '100%',
        maxWidth: '800px',
        height: '400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column'
      }}
      bodyStyle={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem'
      }}
    >
      <div className="flex flex-col items-center justify-center space-y-8 w-full">
        <Title level={3} className="text-blue-600 text-center m-0">
          {randomTrivia.title}
        </Title>
        <Text className="text-gray-700 text-xl text-center max-w-2xl">
          {randomTrivia.fact}
        </Text>
      </div>
    </Card>
  );
};

export default TriviaCard; 