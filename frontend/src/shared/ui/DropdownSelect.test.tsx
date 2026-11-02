import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DropdownSelect } from './DropdownSelect';

const options = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
] as const;

describe('DropdownSelect', () => {
  it('현재 값을 표시하고 선택한 값을 전달한다', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <DropdownSelect
        ariaLabel="정렬"
        value="latest"
        options={options}
        onChange={onChange}
      />,
    );

    const trigger = screen.getByRole('combobox', { name: '정렬' });

    expect(trigger).toHaveTextContent('최신순');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox', { name: '정렬 선택지' })).toHaveStyle({
      width: '100%',
      padding: '6px',
    });
    const selectedOption = screen.getByRole('option', { name: '최신순' });

    expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    expect(selectedOption).toHaveStyle({ padding: '0px 6px' });

    await user.click(screen.getByRole('option', { name: '오래된순' }));

    expect(onChange).toHaveBeenCalledWith('oldest');
    expect(trigger).toHaveFocus();
  });

  it('키보드로 선택지를 탐색하고 Esc로 닫을 수 있다', async () => {
    const user = userEvent.setup();

    render(
      <DropdownSelect
        ariaLabel="정렬"
        value="latest"
        options={options}
        onChange={jest.fn()}
      />,
    );

    const trigger = screen.getByRole('combobox', { name: '정렬' });

    trigger.focus();
    await user.keyboard('{ArrowDown}');

    expect(
      screen.getByRole('listbox', { name: '정렬 선택지' }),
    ).toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      expect.stringContaining('option-0'),
    );

    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      expect.stringContaining('option-1'),
    );

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('현재 선택된 값을 다시 누르면 불필요한 변경을 전달하지 않는다', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <DropdownSelect
        ariaLabel="정렬"
        value="latest"
        options={options}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: '정렬' }));
    await user.click(screen.getByRole('option', { name: '최신순' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('바깥 영역을 누르면 선택지를 닫는다', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <DropdownSelect
          ariaLabel="정렬"
          value="latest"
          options={options}
          onChange={jest.fn()}
        />
        <button type="button">다른 영역</button>
      </div>,
    );

    await user.click(screen.getByRole('combobox', { name: '정렬' }));
    await user.click(screen.getByRole('button', { name: '다른 영역' }));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
