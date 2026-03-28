# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Host::LeaderboardRank" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:host) { create(:user, :host) }
  let(:host2) { create(:user, :host) }
  let(:host3) { create(:user, :host) }
  let(:emcee) { create(:user, :emcee) }
  let(:team) { create(:team) }
  let(:session) { create(:session, team: team, created_by: emcee, date: Date.current) }

  describe "#show" do
    path "/api/v1/host/leaderboard_rank" do
      get "returns the current host's monthly leaderboard rank" do
        tags "Host::LeaderboardRank"
        produces "application/json"

        response(200, "returns rank, total hosts, and monthly coins") do
          before do
            create(:coin_entry, session: session, user: host, coins: 10_000)
            create(:coin_entry, session: session, user: host2, coins: 20_000)
            create(:coin_entry, session: session, user: host3, coins: 5_000)
            sign_in host
          end

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data[:rank]).to eq(2)
            expect(data[:monthly_coins]).to eq(10_000)
            expect(data[:total_hosts]).to eq(3)
          end
        end

        response(200, "rank is 1 when host has the most coins") do
          before do
            create(:coin_entry, session: session, user: host, coins: 50_000)
            create(:coin_entry, session: session, user: host2, coins: 10_000)
            sign_in host
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:rank]).to eq(1)
          end
        end

        response(200, "rank equals total_hosts when host has no coins this month") do
          before do
            create(:coin_entry, session: session, user: host2, coins: 10_000)
            sign_in host
          end

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data[:monthly_coins]).to eq(0)
            expect(data[:rank]).to eq(2)
          end
        end

        response(403, "returns forbidden for emcee") do
          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
