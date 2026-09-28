import styled from '@emotion/styled';

export interface CardProps {
  imageUrl: string;
  name: string;
}

export default function Card(props: CardProps) {
  return (
    <Wrapper>
      <Thumbnail>
        {props.imageUrl ? (
          <ThumbnailImage src={props.imageUrl} alt="" />
        ) : (
          <ImagePlaceholder>이미지 없음</ImagePlaceholder>
        )}
      </Thumbnail>
      <Name>{props.name}</Name>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  max-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Thumbnail = styled.div`
  display: grid;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  place-items: center;
  border-radius: 12px;
  background: #faf7f8;
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImagePlaceholder = styled.span`
  color: #aaa5a8;
  font-size: 13px;
  font-weight: 700;
`;

const Name = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #2b2528;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
