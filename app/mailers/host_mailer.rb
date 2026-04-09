# frozen_string_literal: true

class HostMailer < ApplicationMailer
  def weekly_digest(host)
    @host = host

    week_start = 1.week.ago.beginning_of_week(:monday).to_date
    week_end   = 1.week.ago.end_of_week(:monday).to_date
    month_start = Date.current.beginning_of_month
    month_end   = Date.current

    @coins_last_week = CoinEntry
      .joins(:session)
      .where(user: @host)
      .where(sessions: { date: week_start..week_end })
      .sum(:coins)

    @monthly_total = CoinEntry
      .joins(:session)
      .where(user: @host)
      .where(sessions: { date: month_start..month_end })
      .sum(:coins)

    @quota_progress = (@monthly_total.to_f / User::MONTHLY_COIN_QUOTA * 100).round(1)
    @monthly_quota  = User::MONTHLY_COIN_QUOTA

    all_monthly = CoinEntry
      .joins(:session)
      .where(sessions: { date: month_start..month_end })
      .group(:user_id)
      .sum(:coins)
    sorted_totals = all_monthly.values.sort.reverse
    my_total      = all_monthly[@host.id] || 0
    @rank         = sorted_totals.index(my_total).to_i + 1
    @total_hosts  = User.host.count

    @week_label = "#{week_start.strftime('%b %-d')} – #{week_end.strftime('%b %-d, %Y')}"

    mail(to: @host.email, subject: "Your weekly points summary — #{@week_label}")
  end

  def coins_logged(coin_entry)
    @coin_entry = coin_entry
    @host = coin_entry.user
    @session = coin_entry.session

    @coins_earned = coin_entry.coins
    @session_date = @session.date.strftime("%B %-d, %Y")
    @session_slot = @session.session_slot == "slot_one" ? "First Slot" : "Second Slot"

    month_start = @session.date.beginning_of_month
    month_end = @session.date.end_of_month
    @monthly_total = CoinEntry
      .joins(:session)
      .where(user: @host)
      .where(sessions: { date: month_start..month_end })
      .sum(:coins)

    mail(to: @host.email, subject: "Your coins have been logged — #{@session_date}")
  end
end
